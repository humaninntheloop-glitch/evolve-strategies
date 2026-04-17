import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import QRCode from "qrcode";
import { requireAuth } from "@/lib/dal/auth";
import { getRecordById } from "@/lib/dal/records";
import {
  AI_TOOL_LABELS,
  AI_OUTPUT_IMPACT_LABELS,
  AI_USAGE_TYPE_LABELS,
  HUMAN_REVIEW_PLAN_LABELS,
  AI_USE_JUSTIFICATION_LABELS,
  DECISION_RATIONALE_LABELS,
  REVIEWER_VALIDATION_REFERENCE_LABELS,
  DISTRIBUTION_LABELS,
  RISK_LABELS,
} from "@/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── Color palette ───────────────────────────────────────────
const C = {
  black: rgb(0.06, 0.09, 0.16),
  dark: rgb(0.15, 0.18, 0.22),
  body: rgb(0.28, 0.3, 0.35),
  medium: rgb(0.4, 0.44, 0.49),
  label: rgb(0.52, 0.55, 0.6),
  light: rgb(0.62, 0.65, 0.69),
  rule: rgb(0.85, 0.87, 0.89),
  faint: rgb(0.92, 0.93, 0.94),
  bg: rgb(0.965, 0.97, 0.975),
  white: rgb(1, 1, 1),
  brand: rgb(0.31, 0.27, 0.9),
  brandBg: rgb(0.95, 0.94, 0.99),
  brandBorder: rgb(0.85, 0.82, 0.96),
  emerald: rgb(0.05, 0.55, 0.38),
  emeraldDark: rgb(0.02, 0.37, 0.27),
  emeraldBg: rgb(0.92, 0.98, 0.95),
  emeraldBorder: rgb(0.78, 0.94, 0.86),
  riskLow: rgb(0.05, 0.55, 0.38),
  riskModerate: rgb(0.72, 0.45, 0.07),
  riskHigh: rgb(0.78, 0.12, 0.28),
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const user = await requireAuth();

  const record = await getRecordById(id, user.organizationId);
  if (!record || record.status !== "RECORDED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (user.role === "EMPLOYEE" && record.creatorId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdfBytes = await generateSlipPdf(record, user.organizationName);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="AI-Authorization-Slip-${record.id.slice(0, 8).toUpperCase()}.pdf"`,
    },
  });
}

// ─── PDF Generation ─────────────────────────────────────────
async function generateSlipPdf(
  record: NonNullable<Awaited<ReturnType<typeof getRecordById>>>,
  organizationName: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  let page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // ── Embed assets ─────────────────────────────────────────
  const logoBytes = await readFile(join(process.cwd(), "public", "logo-icon.png"));
  const logoImg = await doc.embedPng(logoBytes);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const qrBuffer = await QRCode.toBuffer(`${siteUrl}/permission-slips/${record.id}`, {
    width: 200,
    margin: 0,
    color: { dark: "#0f1729", light: "#ffffff" },
  });
  const qrImg = await doc.embedPng(qrBuffer);

  // ── Layout constants ─────────────────────────────────────
  const M = 52; // margin
  const W = width - M * 2; // content width
  let y = height - M;

  // ── Helpers ──────────────────────────────────────────────
  type Font = typeof regular;
  type Color = ReturnType<typeof rgb>;

  const ensureSpace = (needed: number) => {
    if (y - needed < 60) {
      page = doc.addPage([595.28, 841.89]);
      y = height - M;
    }
  };

  const text = (s: string, x: number, yy: number, opts: { font?: Font; size?: number; color?: Color } = {}) => {
    page.drawText(s, { x, y: yy, size: opts.size ?? 10, font: opts.font ?? regular, color: opts.color ?? C.body });
  };

  const textCentered = (s: string, yy: number, opts: { font?: Font; size?: number; color?: Color } = {}) => {
    const f = opts.font ?? regular;
    const sz = opts.size ?? 10;
    const tw = f.widthOfTextAtSize(s, sz);
    text(s, M + (W - tw) / 2, yy, opts);
  };

  const wrap = (s: string, font: Font, size: number, maxW: number): string[] => {
    const words = s.replace(/\n/g, " ").split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  };

  const rect = (x: number, yy: number, w: number, h: number, opts: { fill?: Color; border?: Color; bw?: number } = {}) => {
    if (opts.fill) page.drawRectangle({ x, y: yy, width: w, height: h, color: opts.fill });
    if (opts.border) page.drawRectangle({ x, y: yy, width: w, height: h, borderColor: opts.border, borderWidth: opts.bw ?? 0.5 });
  };

  const hr = (yy: number): number => {
    page.drawLine({ start: { x: M, y: yy }, end: { x: width - M, y: yy }, thickness: 0.5, color: C.rule });
    return yy - 20;
  };

  // Determine if record uses new or legacy fields
  const hasNewFields = !!record.aiOutputImpact;

  // ── Table drawing helper ─────────────────────────────────
  const drawTable = (
    colWidths: number[],
    headers: string[],
    rows: string[][],
    colFonts?: Font[],
  ) => {
    const cellPadX = 8;
    const cellPadY = 6;
    const dataSize = 8.5;
    const headerSize = 7.5;
    const lineH = 12;
    const minRowH = 24;
    const tableX = M;

    // Header row
    let maxHdrLines = 1;
    for (let i = 0; i < headers.length; i++) {
      const lines = wrap(headers[i], bold, headerSize, colWidths[i] - cellPadX * 2);
      maxHdrLines = Math.max(maxHdrLines, lines.length);
    }
    const hdrH = Math.max(minRowH, maxHdrLines * lineH + cellPadY * 2);
    ensureSpace(hdrH + 60);
    rect(tableX, y - hdrH, W, hdrH, { fill: C.faint, border: C.rule });

    let colX = tableX;
    for (let i = 0; i < headers.length; i++) {
      text(headers[i].toUpperCase(), colX + cellPadX, y - cellPadY - 8, {
        font: bold, size: headerSize, color: C.label,
      });
      colX += colWidths[i];
    }

    colX = tableX;
    for (let i = 1; i < colWidths.length; i++) {
      colX += colWidths[i - 1];
      page.drawLine({
        start: { x: colX, y: y },
        end: { x: colX, y: y - hdrH },
        thickness: 0.5, color: C.rule,
      });
    }
    y -= hdrH;

    // Data rows
    for (const cells of rows) {
      const wrapped: string[][] = [];
      let maxLines = 1;
      for (let i = 0; i < cells.length; i++) {
        const f = colFonts?.[i] ?? regular;
        const lines = wrap(cells[i] || "\u2014", f, dataSize, colWidths[i] - cellPadX * 2);
        wrapped.push(lines);
        maxLines = Math.max(maxLines, lines.length);
      }
      const rH = Math.max(minRowH, maxLines * lineH + cellPadY * 2);
      ensureSpace(rH + 4);

      rect(tableX, y - rH, W, rH, { border: C.rule });

      colX = tableX;
      for (let i = 0; i < cells.length; i++) {
        const f = colFonts?.[i] ?? regular;
        let cellY = y - cellPadY - 8;
        for (const line of wrapped[i]) {
          text(line, colX + cellPadX, cellY, { font: f, size: dataSize, color: C.body });
          cellY -= lineH;
        }
        colX += colWidths[i];
      }

      colX = tableX;
      for (let i = 1; i < colWidths.length; i++) {
        colX += colWidths[i - 1];
        page.drawLine({
          start: { x: colX, y: y },
          end: { x: colX, y: y - rH },
          thickness: 0.5, color: C.rule,
        });
      }
      y -= rH;
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  TOP BAND — Logo + Org (left) | QR verification (right)
  // ═══════════════════════════════════════════════════════════

  const topBandH = 72;
  const qrBoxW = 100;
  const qrSize = 52;

  const qrBoxX = width - M - qrBoxW;
  const qrBoxY = y - topBandH;
  rect(qrBoxX, qrBoxY, qrBoxW, topBandH, { fill: C.bg, border: C.rule });

  const qrX = qrBoxX + (qrBoxW - qrSize) / 2;
  const qrY = qrBoxY + topBandH - 8 - qrSize;
  page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  const captionText = "Scan to verify";
  const captionW = regular.widthOfTextAtSize(captionText, 6);
  text(captionText, qrBoxX + (qrBoxW - captionW) / 2, qrBoxY + 5, { size: 6, color: C.light });

  const logoSize = 36;
  page.drawImage(logoImg, {
    x: M,
    y: y - logoSize - 2,
    width: logoSize,
    height: logoSize,
  });

  const textLeftX = M + logoSize + 10;
  text(organizationName, textLeftX, y - 14, { font: bold, size: 12, color: C.black });
  text("Human In The Loop", textLeftX, y - 28, { size: 8.5, color: C.label });

  const idStr = `#${record.id.slice(0, 8).toUpperCase()}`;
  text(idStr, textLeftX, y - 44, { font: regular, size: 9, color: C.light });

  y -= topBandH + 16;

  // ═══════════════════════════════════════════════════════════
  //  1. TITLE
  // ═══════════════════════════════════════════════════════════

  textCentered("AI Permission Slip: Final Authorization Record", y, { font: bold, size: 14, color: C.black });
  y -= 20;

  const subtitleText = "This document constitutes a formal governance record for the reliance on AI-generated output. It serves as the official source of truth for internal auditing and regulatory compliance, capturing the intent, risk assessment, and human authorization for the specified workflow.";
  const subtitleLines = wrap(subtitleText, regular, 8.5, W - 40);
  for (const line of subtitleLines) {
    textCentered(line, y, { size: 8.5, color: C.medium });
    y -= 12;
  }
  y -= 16;

  // ═══════════════════════════════════════════════════════════
  //  2. AI PERMISSION SLIP TABLE
  // ═══════════════════════════════════════════════════════════

  const fieldColW = 150;
  const detailColW = W - fieldColW;

  if (hasNewFields) {
    const usageText = record.aiUsageType.length > 0
      ? record.aiUsageType.map((t: string) => AI_USAGE_TYPE_LABELS[t] ?? t).join(", ")
        + (record.aiUsageTypeOther ? ` (Other: ${record.aiUsageTypeOther})` : "")
      : "\u2014";

    const justText = record.aiUseJustification.length > 0
      ? record.aiUseJustification.map((j: string) => AI_USE_JUSTIFICATION_LABELS[j] ?? j).join(", ")
        + (record.aiUseJustificationOther ? ` (Other: ${record.aiUseJustificationOther})` : "")
      : "\u2014";

    const planText = record.humanReviewPlan.length > 0
      ? record.humanReviewPlan.map((p: string) => HUMAN_REVIEW_PLAN_LABELS[p] ?? p).join(", ")
        + (record.humanReviewPlanOther ? ` (Other: ${record.humanReviewPlanOther})` : "")
      : "\u2014";

    const newFieldsRows: string[][] = [
      ["Record ID", `#${record.id.slice(0, 8).toUpperCase()}`],
      ["Requestor", record.creator.fullName],
      ["Submission Date", formatDate(record.submittedAt)],
      ["AI Tool(s) Used", (record.aiToolUsed.length > 0 ? record.aiToolUsed.map((t) => AI_TOOL_LABELS[t] ?? t).join(", ") : "\u2014") + (record.aiToolUsedOther ? ` — ${record.aiToolUsedOther}` : "")],
      ["AI Reliance Type", usageText],
      ["AI Use Justification", justText],
      ["AI Output Impact", record.aiOutputImpact ? AI_OUTPUT_IMPACT_LABELS[record.aiOutputImpact] : "\u2014"],
      ["Sensitive Data Flag", record.dataSensitivity ? "Yes" : "No"],
      ["Human Review Plan", planText],
    ];
    if (record.attachmentName) {
      newFieldsRows.push(["Supporting Document", record.attachmentName]);
    }

    drawTable(
      [fieldColW, detailColW],
      ["Field", "Detail"],
      newFieldsRows,
      [bold, regular],
    );
  } else {
    const legacyRows: string[][] = [
      ["Record ID", `#${record.id.slice(0, 8).toUpperCase()}`],
      ["Requestor", record.creator.fullName],
      ["Submission Date", formatDate(record.submittedAt)],
      ["AI Tool(s) Used", (record.aiToolUsed.length > 0 ? record.aiToolUsed.map((t) => AI_TOOL_LABELS[t] ?? t).join(", ") : "\u2014") + (record.aiToolUsedOther ? ` — ${record.aiToolUsedOther}` : "")],
      ["Distribution", record.distributionContext ? DISTRIBUTION_LABELS[record.distributionContext] : "\u2014"],
      ["Sensitive Data", record.dataSensitivity ? "Yes" : "No"],
      ["High-Stakes Decision", record.highStakesDecision ? "Yes" : "No"],
      ["AI Justification", record.aiJustification ?? "\u2014"],
    ];
    if (record.attachmentName) {
      legacyRows.push(["Supporting Document", record.attachmentName]);
    }

    drawTable(
      [fieldColW, detailColW],
      ["Field", "Detail"],
      legacyRows,
      [bold, regular],
    );
  }

  y -= 24;

  // ═══════════════════════════════════════════════════════════
  //  3. RISK EXPLANATION
  // ═══════════════════════════════════════════════════════════

  ensureSpace(120);
  text("Risk Explanation", M, y, { font: bold, size: 11, color: C.black });
  y -= 16;

  const riskIntro = "The risk classification for this record is determined by a deterministic logic framework that evaluates the intended impact of the AI output and the presence of sensitive or regulated data.";
  const riskIntroLines = wrap(riskIntro, regular, 8.5, W);
  for (const line of riskIntroLines) {
    text(line, M, y, { size: 8.5, color: C.medium });
    y -= 12;
  }
  y -= 8;

  // Risk Classification
  const riskText = record.riskLevel ? RISK_LABELS[record.riskLevel] : "\u2014";
  const riskColor = record.riskLevel === "LOW"
    ? C.riskLow
    : record.riskLevel === "MODERATE"
      ? C.riskModerate
      : record.riskLevel === "HIGH"
        ? C.riskHigh
        : C.medium;

  text("Risk Classification:", M, y, { font: bold, size: 9.5, color: C.dark });
  const riskLabelW = bold.widthOfTextAtSize("Risk Classification: ", 9.5);
  text(riskText, M + riskLabelW, y, { font: bold, size: 9.5, color: riskColor });
  y -= 18;

  // Logic Rationale
  if (record.riskJustification) {
    text("Logic Rationale:", M, y, { font: bold, size: 9.5, color: C.dark });
    y -= 14;
    const ratLines = wrap(record.riskJustification, regular, 9, W - 12);
    for (const line of ratLines) {
      text(line, M + 6, y, { size: 9, color: C.body });
      y -= 12;
    }
    y -= 6;
  }

  // AI Risk Explanation (if aiSummary exists)
  if (record.aiSummary) {
    ensureSpace(80);
    y -= 6;
    text("AI Risk Explanation:", M, y, { font: bold, size: 9.5, color: C.dark });
    y -= 14;
    const summaryLines = wrap(record.aiSummary, regular, 9, W - 12);
    for (const line of summaryLines) {
      text(line, M + 6, y, { size: 9, color: C.body });
      y -= 12;
    }
    y -= 6;
  }

  y -= 16;

  // ═══════════════════════════════════════════════════════════
  //  4. AUTHORIZATION DECISION
  // ═══════════════════════════════════════════════════════════

  ensureSpace(140);
  text("Authorization Decision", M, y, { font: bold, size: 11, color: C.black });
  y -= 16;

  const authIntro = "This section records the explicit human-in-the-loop checkpoint where reliance on the AI output was formally authorized.";
  const authIntroLines = wrap(authIntro, regular, 8.5, W);
  for (const line of authIntroLines) {
    text(line, M, y, { size: 8.5, color: C.medium });
    y -= 12;
  }
  y -= 8;

  const isAutoApproved = !record.reviewer;

  // Authorization Status
  text("Authorization Status:", M, y, { font: bold, size: 9.5, color: C.dark });
  const statusLabelW = bold.widthOfTextAtSize("Authorization Status: ", 9.5);
  text("AUTHORIZED FOR AI RELIANCE", M + statusLabelW, y, { font: bold, size: 9.5, color: C.emerald });
  y -= 18;

  // Authorized By
  text("Authorized By:", M, y, { font: bold, size: 9.5, color: C.dark });
  const authByLabelW = bold.widthOfTextAtSize("Authorized By: ", 9.5);
  text(
    isAutoApproved ? "Auto-authorized (Low Risk)" : record.reviewer!.fullName,
    M + authByLabelW, y, { size: 9.5, color: C.body },
  );
  y -= 18;

  // Decision Rationale
  if (record.reviewerDecisionRationale) {
    text("Decision Rationale:", M, y, { font: bold, size: 9.5, color: C.dark });
    y -= 14;
    const ratText = DECISION_RATIONALE_LABELS[record.reviewerDecisionRationale] ?? record.reviewerDecisionRationale;
    const fullRatText = ratText + (record.reviewerDecisionRationaleOther ? ` \u2014 ${record.reviewerDecisionRationaleOther}` : "");
    const ratLines = wrap(fullRatText, regular, 9, W - 12);
    for (const line of ratLines) {
      text(line, M + 6, y, { size: 9, color: C.body });
      y -= 12;
    }
    y -= 4;
  } else if (isAutoApproved) {
    text("Decision Rationale:", M, y, { font: bold, size: 9.5, color: C.dark });
    y -= 14;
    text("Auto-authorized \u2014 Low risk classification", M + 6, y, { size: 9, color: C.medium });
    y -= 16;
  }

  // Validation Reference
  if (record.reviewerValidationReference.length > 0) {
    text("Validation Reference:", M, y, { font: bold, size: 9.5, color: C.dark });
    y -= 14;
    const valText = record.reviewerValidationReference
      .map((v: string) => REVIEWER_VALIDATION_REFERENCE_LABELS[v] ?? v)
      .join(", ")
      + (record.reviewerValidationReferenceOther ? ` (Other: ${record.reviewerValidationReferenceOther})` : "");
    const valLines = wrap(valText, regular, 9, W - 12);
    for (const line of valLines) {
      text(line, M + 6, y, { size: 9, color: C.body });
      y -= 12;
    }
    y -= 4;
  }

  // Reviewer Note
  if (record.reviewComment) {
    text("Reviewer Note:", M, y, { font: bold, size: 9.5, color: C.dark });
    y -= 14;
    const noteLines = wrap(`\u201C${record.reviewComment}\u201D`, regular, 9, W - 12);
    for (const line of noteLines) {
      text(line, M + 6, y, { size: 9, color: C.body });
      y -= 12;
    }
    y -= 4;
  }

  // Authorization Timestamp
  text("Authorization Timestamp:", M, y, { font: bold, size: 9.5, color: C.dark });
  const tsLabelW = bold.widthOfTextAtSize("Authorization Timestamp: ", 9.5);
  text(formatDate(record.approvedAt), M + tsLabelW, y, { size: 9.5, color: C.body });
  y -= 24;

  // ═══════════════════════════════════════════════════════════
  //  5. TIMELINE / AUDIT TABLE
  // ═══════════════════════════════════════════════════════════

  ensureSpace(120);
  text("Timeline / Audit", M, y, { font: bold, size: 11, color: C.black });
  y -= 16;

  const timelineIntro = "This audit trail creates an immutable record of the governance chain, ensuring that the transition from intent to reliance was subject to the required controls.";
  const timelineIntroLines = wrap(timelineIntro, regular, 8.5, W);
  for (const line of timelineIntroLines) {
    text(line, M, y, { size: 8.5, color: C.medium });
    y -= 12;
  }
  y -= 8;

  const timelineRows: string[][] = [
    ["DRAFT", "Initial capture of intent and justification", formatDate(record.createdAt), record.creator.fullName],
    ["SUBMITTED", "Submission for risk assessment and review", formatDate(record.submittedAt), record.creator.fullName],
  ];

  if (!isAutoApproved) {
    timelineRows.push(
      ["REVIEWED", "Risk determination and reviewer assessment", formatDate(record.approvedAt), record.reviewer!.fullName],
    );
  }

  timelineRows.push(
    ["AUTHORIZED", "Explicit authorization of AI reliance", formatDate(record.approvedAt), isAutoApproved ? "SYSTEM" : record.reviewer!.fullName],
    ["RECORDED", "Record locked as an immutable audit artifact", formatDate(record.recordedAt), "SYSTEM"],
  );

  const eventColW = 80;
  const tsColW = 100;
  const userColW = 110;
  const actionColW = W - eventColW - tsColW - userColW;

  drawTable(
    [eventColW, actionColW, tsColW, userColW],
    ["Event", "Action", "Timestamp", "User"],
    timelineRows,
  );

  y -= 24;

  // ═══════════════════════════════════════════════════════════
  //  6. COMPLIANCE CERTIFICATION
  // ═══════════════════════════════════════════════════════════

  ensureSpace(80);
  text("Compliance Certification", M, y, { font: bold, size: 11, color: C.black });
  y -= 16;

  const certText = "I confirm that the appropriate human oversight has occurred before authorizing reliance on AI output, and that this record accurately reflects the governance process applied to the task.";
  const certLines = wrap(certText, regular, 9, W);
  for (const line of certLines) {
    text(line, M, y, { size: 9, color: C.body });
    y -= 12;
  }

  // ═══════════════════════════════════════════════════════════
  //  WATERMARK (bottom center)
  // ═══════════════════════════════════════════════════════════

  const watermark = "This document was generated by Human In The Loop";
  const watermarkY = 30;
  const wmFont = regular;
  const wmSize = 7;
  const wmW = wmFont.widthOfTextAtSize(watermark, wmSize);
  page.drawText(watermark, { x: M + (W - wmW) / 2, y: watermarkY, size: wmSize, font: wmFont, color: C.rule });

  return doc.save();
}
