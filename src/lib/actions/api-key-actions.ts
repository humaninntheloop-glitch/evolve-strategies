"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";
import { handleActionError } from "@/lib/errors";
import type { ActionResult } from "@/types";

const KEY_PREFIX_LITERAL = "hitl_";
const KEY_RANDOM_BYTES = 32; // 64 hex chars
const KEY_DISPLAY_LENGTH = 12; // chars of the full key shown in the UI

const createApiKeySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be under 100 characters"),
});

export interface ApiKeyListItem {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  createdByName: string;
}

/** Generate a new API key. The plaintext is returned ONCE and never stored. */
function generateApiKey(): { plaintext: string; keyHash: string; keyPrefix: string } {
  const plaintext = `${KEY_PREFIX_LITERAL}${randomBytes(KEY_RANDOM_BYTES).toString("hex")}`;
  const keyHash = createHash("sha256").update(plaintext).digest("hex");
  const keyPrefix = plaintext.slice(0, KEY_DISPLAY_LENGTH);
  return { plaintext, keyHash, keyPrefix };
}

export async function listApiKeys(): Promise<ActionResult<ApiKeyListItem[]>> {
  const user = await requireRole("ADMIN");

  try {
    const keys = await prisma.apiKey.findMany({
      where: { organizationId: user.organizationId },
      include: { createdBy: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: keys.map((key) => ({
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        isActive: key.isActive,
        lastUsedAt: key.lastUsedAt,
        createdAt: key.createdAt,
        createdByName: key.createdBy.fullName,
      })),
    };
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
}

export async function createApiKey(
  name: string
): Promise<ActionResult<{ id: string; key: string; keyPrefix: string }>> {
  const user = await requireRole("ADMIN");

  const parsed = createApiKeySchema.safeParse({ name });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { plaintext, keyHash, keyPrefix } = generateApiKey();

  try {
    const apiKey = await prisma.apiKey.create({
      data: {
        organizationId: user.organizationId,
        createdById: user.id,
        name: parsed.data.name,
        keyHash,
        keyPrefix,
      },
      select: { id: true },
    });

    revalidatePath("/admin/api-keys");
    // Plaintext key is returned ONLY here — it is never written to the database.
    return { success: true, data: { id: apiKey.id, key: plaintext, keyPrefix } };
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
}

export async function revokeApiKey(id: string): Promise<ActionResult> {
  const user = await requireRole("ADMIN");

  try {
    const result = await prisma.apiKey.updateMany({
      where: { id, organizationId: user.organizationId, isActive: true },
      data: { isActive: false },
    });

    if (result.count === 0) {
      return { success: false, error: "API key not found" };
    }

    revalidatePath("/admin/api-keys");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: handleActionError(error) };
  }
}
