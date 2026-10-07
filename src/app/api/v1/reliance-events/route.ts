import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { AiOutputImpact } from "@/generated/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/reliance-events
 *
 * Machine API for integrations (e.g. the Chrome extension) to file AI
 * reliance events as DRAFT permission-slip records.
 *
 * Auth: `Authorization: Bearer hitl_<64 hex chars>`. The presented key is
 * SHA-256 hashed and matched against the stored hash — the plaintext key
 * is never persisted.
 */

const AI_OUTPUT_IMPACTS = [
  "INTERNAL_NOTES",
  "INTERNAL_RESEARCH",
  "INTERNAL_DOCUMENT",
  "CLIENT_COMMUNICATION",
  "EXTERNAL_REPORTS",
  "FINANCIAL_LEGAL",
  "REGULATORY_COMPLIANCE",
] as const;

const relianceEventSchema = z
  .object({
    // Core reliance fields (same vocabulary as the web record form)
    aiToolUsed: z.array(z.string()).min(1, "Select at least one AI tool"),
    aiToolUsedOther: z.string().max(200).optional(),
    aiOutputImpact: z.enum(AI_OUTPUT_IMPACTS, {
      message: "aiOutputImpact is required",
    }),
    dataSensitivity: z.boolean(),
    aiUsageType: z.array(z.string()).min(1, "Select at least one AI reliance type"),
    aiUsageTypeOther: z.string().max(500).optional(),
    humanReviewPlan: z.array(z.string()).min(1, "Select at least one human review plan"),
    humanReviewPlanOther: z.string().max(500).optional(),
    aiUseJustification: z.array(z.string()).min(1, "Select at least one justification for AI use"),
    aiUseJustificationOther: z.string().max(500).optional(),
    // Extension-captured context (optional)
    intendedUseDescription: z.string().max(2000).optional(),
    aiSummary: z.string().max(20000).optional(),
    sourceUrl: z.string().url().max(2000).optional(),
    capturedAt: z.iso.datetime().optional(),
  })
  .refine(
    (data) =>
      !data.aiUsageType.includes("OTHER") ||
      (data.aiUsageTypeOther && data.aiUsageTypeOther.trim().length > 0),
    { message: "Please specify the other AI reliance type", path: ["aiUsageTypeOther"] }
  )
  .refine(
    (data) =>
      !data.humanReviewPlan.includes("OTHER") ||
      (data.humanReviewPlanOther && data.humanReviewPlanOther.trim().length > 0),
    { message: "Please specify the other review plan", path: ["humanReviewPlanOther"] }
  )
  .refine(
    (data) =>
      !data.aiUseJustification.includes("OTHER") ||
      (data.aiUseJustificationOther && data.aiUseJustificationOther.trim().length > 0),
    { message: "Please specify the other justification", path: ["aiUseJustificationOther"] }
  )
  .refine(
    (data) =>
      !data.aiToolUsed.includes("OTHER") ||
      (data.aiToolUsedOther && data.aiToolUsedOther.trim().length > 0),
    { message: "Please specify the other AI tool", path: ["aiToolUsedOther"] }
  );

/** Legacy derivations, kept in sync with src/lib/actions/record-actions.ts.
 *  (Copied here deliberately — that file is a "use server" module and cannot
 *  be imported from a route handler.) */
function deriveDistributionContext(impact: AiOutputImpact) {
  const external: AiOutputImpact[] = [
    "CLIENT_COMMUNICATION",
    "EXTERNAL_REPORTS",
    "FINANCIAL_LEGAL",
    "REGULATORY_COMPLIANCE",
  ];
  return external.includes(impact) ? "EXTERNAL" : "INTERNAL";
}

function deriveHighStakesDecision(impact: AiOutputImpact) {
  const highStakes: AiOutputImpact[] = ["FINANCIAL_LEGAL", "REGULATORY_COMPLIANCE"];
  return highStakes.includes(impact);
}

// ── Simple in-memory rate limiting (per API key) ──────────────────────────
// TODO: replace with a Redis/Upstash-backed limiter before multi-instance
// production use — this bucket is local to a single serverless instance.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 100;
const rateLimitBuckets = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(bucketKey: string): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(bucketKey);
  if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitBuckets.set(bucketKey, { count: 1, windowStart: now });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  return /^Bearer (hitl_[a-f0-9]{64})$/i.exec(header)?.[1] ?? null;
}

export async function POST(request: Request) {
  // ── Authenticate the API key ────────────────────────────────────────────
  const token = getBearerToken(request);
  if (!token || !token.startsWith("hitl_")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keyHash = createHash("sha256").update(token).digest("hex");

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { createdBy: { select: { isActive: true, role: true, organizationId: true } } },
  });
  if (!apiKey || !apiKey.isActive || !apiKey.createdBy.isActive ||
      apiKey.createdBy.role !== "ADMIN" || apiKey.createdBy.organizationId !== apiKey.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only authenticated keys allocate buckets; discard expired entries.
  for (const [key, bucket] of rateLimitBuckets) {
    if (Date.now() - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) rateLimitBuckets.delete(key);
  }
  if (isRateLimited(keyHash)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, {
      status: 429, headers: { "Retry-After": "60" },
    });
  }

  // ── Validate the payload ────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = relianceEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 422 }
    );
  }

  // ── Create the DRAFT record + audit entry ───────────────────────────────
  const data = parsed.data;
  const impact = data.aiOutputImpact as AiOutputImpact;

  try {
    const record = await prisma.$transaction(async (tx) => {
      const record = await tx.record.create({
        data: {
          organizationId: apiKey.organizationId,
          creatorId: apiKey.createdById,
          intendedUseDescription: data.intendedUseDescription ?? null,
          aiToolUsed: data.aiToolUsed,
          aiToolUsedOther: data.aiToolUsed.includes("OTHER")
            ? (data.aiToolUsedOther ?? null)
            : null,
          aiOutputImpact: impact,
          dataSensitivity: data.dataSensitivity,
          aiUsageType: data.aiUsageType,
          aiUsageTypeOther: data.aiUsageTypeOther ?? null,
          humanReviewPlan: data.humanReviewPlan,
          humanReviewPlanOther: data.humanReviewPlanOther ?? null,
          aiUseJustification: data.aiUseJustification,
          aiUseJustificationOther: data.aiUseJustificationOther ?? null,
          aiSummary: data.aiSummary ?? null,
          // Legacy derivations, kept for backward compat
          distributionContext: deriveDistributionContext(impact),
          highStakesDecision: deriveHighStakesDecision(impact),
          status: "DRAFT",
        },
        select: { id: true },
      });

      await tx.auditLog.create({ data: {
        organizationId: apiKey.organizationId,
        recordId: record.id,
        actionType: "RECORD_CREATED_VIA_EXTENSION",
        actorId: apiKey.createdById,
        newState: "DRAFT",
        metadata: {
          sourceUrl: data.sourceUrl ?? null,
          capturedAt: data.capturedAt ?? null,
        },
      } });
      await tx.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
      return record;
    });

    return NextResponse.json(
      {
        id: record.id,
        status: "DRAFT",
        url: `/permission-slips/${record.id}`,
      },
      { status: 201 }
    );
  } catch {
    // Intentionally no request-body logging: payloads may contain PII.
    console.error("reliance-events POST failed");
    return NextResponse.json(
      { error: "Failed to create reliance event" },
      { status: 500 }
    );
  }
}
