import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import QRCode from "qrcode";
import { requireAuth } from "@/lib/dal/auth";
import { getRecordById } from "@/lib/dal/records";
import { DISTRIBUTION_LABELS, RISK_LABELS } from "@/types";
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
      "Content-Disposition": `attachment; filename="HITL-Record-${record.id.slice(0, 8).toUpperCase()}.pdf"`,
    },
  });
}

// ─── PDF Generation ─────────────────────────────────────────
async function generateSlipPdf(
  record: NonNullable<Awaited<ReturnType<typeof getRecordById>>>,
  organizationName: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // ── Embed assets ─────────────────────────────────────────
  const logoBytes = await readFile(join(process.cwd(), "public", "logo-icon.png"));
  const logoImg = await doc.embedPng(logoBytes);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const qrBuffer = await QRCode.toBuffer(`${siteUrl}/records/${record.id}`, {
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

  const label = (s: string, x: number, yy: number) => {
    text(s.toUpperCase(), x, yy, { font: bold, size: 7, color: C.label });
  };

  const rect = (x: number, yy: number, w: number, h: number, opts: { fill?: Color; border?: Color; bw?: number } = {}) => {
    if (opts.fill) page.drawRectangle({ x, y: yy, width: w, height: h, color: opts.fill });
    if (opts.border) page.drawRectangle({ x, y: yy, width: w, height: h, borderColor: opts.border, borderWidth: opts.bw ?? 0.5 });
  };

  const hr = (yy: number): number => {
    page.drawLine({ start: { x: M, y: yy }, end: { x: width - M, y: yy }, thickness: 0.5, color: C.rule });
    return yy - 20;
  };

  // ═══════════════════════════════════════════════════════════
  //  TOP BAND — Logo + Org (left) | QR verification (right)
  // ═══════════════════════════════════════════════════════════

  const topBandH = 72;
  const qrBoxW = 100;
  const qrSize = 52;

  // QR verification box (right side)
  const qrBoxX = width - M - qrBoxW;
  const qrBoxY = y - topBandH;
  rect(qrBoxX, qrBoxY, qrBoxW, topBandH, { fill: C.bg, border: C.rule });

  // Center QR inside box
  const qrX = qrBoxX + (qrBoxW - qrSize) / 2;
  const qrY = qrBoxY + topBandH - 8 - qrSize;
  page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  // "Scan to verify" caption centered under QR
  const captionText = "Scan to verify";
  const captionW = regular.widthOfTextAtSize(captionText, 6);
  text(captionText, qrBoxX + (qrBoxW - captionW) / 2, qrBoxY + 5, { size: 6, color: C.light });

  // Logo (left side)
  const logoSize = 36;
  page.drawImage(logoImg, {
    x: M,
    y: y - logoSize - 2,
    width: logoSize,
    height: logoSize,
  });

  // Org name + platform name
  const textLeftX = M + logoSize + 10;
  text(organizationName, textLeftX, y - 14, { font: bold, size: 14, color: C.black });
  text("Human In The Loop", textLeftX, y - 28, { size: 8.5, color: C.label });

  // Record ID below org info
  const idStr = `#${record.id.slice(0, 8).toUpperCase()}`;
  text(idStr, textLeftX, y - 44, { font: regular, size: 9, color: C.light });

  y -= topBandH + 16;

  // ═══════════════════════════════════════════════════════════
  //  DOCUMENT TITLE (centered)
  // ═══════════════════════════════════════════════════════════

  textCentered("AI Usage Documentation Record", y, { font: bold, size: 18, color: C.black });
  y -= 22;
  textCentered(`Recorded on ${formatDate(record.recordedAt)}`, y, { size: 9.5, color: C.medium });
  y -= 28;

  // ═══════════════════════════════════════════════════════════
  //  STATUS BANNER (centered)
  // ═══════════════════════════════════════════════════════════

  const bannerH = 32;
  rect(M, y - bannerH, W, bannerH, { fill: C.emeraldBg, border: C.emeraldBorder });

  const statusText = "RECORDED — IMMUTABLE";
  const statusW = bold.widthOfTextAtSize(statusText, 8.5);
  text(statusText, M + (W - statusW) / 2, y - bannerH + 12, { font: bold, size: 8.5, color: C.emeraldDark });

  y -= bannerH + 28;

  // ═══════════════════════════════════════════════════════════
  //  DIVIDER
  // ═══════════════════════════════════════════════════════════

  y = hr(y);

  // ═══════════════════════════════════════════════════════════
  //  AI TOOL USED
  // ═══════════════════════════════════════════════════════════

  label("AI Tool Used", M, y);
  y -= 16;
  text(record.aiToolUsed, M, y, { font: bold, size: 12, color: C.black });
  y -= 26;

  // ═══════════════════════════════════════════════════════════
  //  INTENDED USE
  // ═══════════════════════════════════════════════════════════

  label("Intended Use", M, y);
  y -= 16;
  const useLines = wrap(record.intendedUseDescription, regular, 10, W);
  for (const line of useLines) {
    text(line, M, y, { size: 10, color: C.body });
    y -= 14;
  }
  y -= 14;

  // ═══════════════════════════════════════════════════════════
  //  STRUCTURED INPUTS — 4-column card
  // ═══════════════════════════════════════════════════════════

  const cardPad = 14;
  const cardInnerH = 36;
  const cardH = cardInnerH + cardPad * 2;
  const colW = W / 4;

  rect(M, y - cardH, W, cardH, { fill: C.bg, border: C.rule });

  const cardTop = y - cardPad;

  // Column helper — labels & values centered within each column
  const drawCol = (col: number, labelStr: string, valueStr: string, valueColor: Color = C.black) => {
    const colX = M + colW * col;
    const colCenter = colX + colW / 2;

    const lw = bold.widthOfTextAtSize(labelStr.toUpperCase(), 7);
    text(labelStr.toUpperCase(), colCenter - lw / 2, cardTop, { font: bold, size: 7, color: C.label });

    const vw = bold.widthOfTextAtSize(valueStr, 11);
    text(valueStr, colCenter - vw / 2, cardTop - 18, { font: bold, size: 11, color: valueColor });
  };

  drawCol(0, "Distribution", DISTRIBUTION_LABELS[record.distributionContext]);
  drawCol(1, "Sensitive Data", record.dataSensitivity ? "Yes" : "No");
  drawCol(2, "High-Stakes", record.highStakesDecision ? "Yes" : "No");

  const riskText = record.riskLevel ? RISK_LABELS[record.riskLevel] : "—";
  const riskColor = record.riskLevel === "LOW"
    ? C.riskLow
    : record.riskLevel === "MODERATE"
      ? C.riskModerate
      : record.riskLevel === "HIGH"
        ? C.riskHigh
        : C.medium;
  drawCol(3, "Risk Level", riskText, riskColor);

  // Draw subtle column dividers
  for (let i = 1; i < 4; i++) {
    const dx = M + colW * i;
    page.drawLine({
      start: { x: dx, y: y - cardH + cardPad },
      end: { x: dx, y: y - cardPad },
      thickness: 0.5,
      color: C.rule,
    });
  }

  y -= cardH + 24;

  // ═══════════════════════════════════════════════════════════
  //  RISK ASSESSMENT (if present)
  // ═══════════════════════════════════════════════════════════

  if (record.riskJustification) {
    label("Risk Assessment", M, y);
    y -= 16;

    const justLines = wrap(record.riskJustification, regular, 9.5, W - 24);
    const blockH = justLines.length * 14 + 20;

    rect(M, y - blockH + 4, W, blockH, { fill: C.bg, border: C.rule });

    let lineY = y - 6;
    for (const line of justLines) {
      text(line, M + 12, lineY, { size: 9.5, color: C.medium });
      lineY -= 14;
    }

    y -= blockH + 20;
  }

  // ═══════════════════════════════════════════════════════════
  //  REVIEW COMMENT (if present)
  // ═══════════════════════════════════════════════════════════

  if (record.reviewComment) {
    label("Review Comment", M, y);
    y -= 16;

    const commentLines = wrap(`"${record.reviewComment}"`, regular, 9.5, W - 24);
    const blockH = commentLines.length * 14 + 20;

    rect(M, y - blockH + 4, W, blockH, { fill: C.bg, border: C.rule });

    let lineY = y - 6;
    for (const line of commentLines) {
      text(line, M + 12, lineY, { size: 9.5, color: C.medium });
      lineY -= 14;
    }

    y -= blockH + 4;

    if (record.reviewer) {
      text(`— ${record.reviewer.fullName}`, M + 12, y, { size: 8, color: C.light });
      y -= 22;
    } else {
      y -= 16;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  DIVIDER
  // ═══════════════════════════════════════════════════════════

  y = hr(y);

  // ═══════════════════════════════════════════════════════════
  //  FOOTER — People & Dates (3 columns, centered within each)
  // ═══════════════════════════════════════════════════════════

  const footColW = W / 3;

  const drawFootCol = (col: number, labelStr: string, valueStr: string) => {
    const colX = M + footColW * col;
    const colCenter = colX + footColW / 2;

    const lw = bold.widthOfTextAtSize(labelStr.toUpperCase(), 7);
    text(labelStr.toUpperCase(), colCenter - lw / 2, y, { font: bold, size: 7, color: C.label });

    const vw = bold.widthOfTextAtSize(valueStr, 10);
    text(valueStr, colCenter - vw / 2, y - 16, { font: bold, size: 10, color: C.black });
  };

  drawFootCol(0, "Created By", record.creator.fullName);
  drawFootCol(1, "Reviewed By", record.reviewer?.fullName ?? "Auto-approved");
  drawFootCol(2, "Recorded", formatDate(record.recordedAt));

  y -= 48;

  // ═══════════════════════════════════════════════════════════
  //  WATERMARK (bottom center)
  // ═══════════════════════════════════════════════════════════

  const watermark = "This document was generated by Human In The Loop";
  textCentered(watermark, M + 10, { size: 7, color: C.rule });

  return doc.save();
}
