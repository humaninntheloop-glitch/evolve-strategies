import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { requireAuth } from "@/lib/dal/auth";
import { getRecordById } from "@/lib/dal/records";
import { DISTRIBUTION_LABELS, RISK_LABELS } from "@/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── Color palette ───────────────────────────────────────────
const COLORS = {
  black: rgb(0.06, 0.09, 0.16),
  dark: rgb(0.15, 0.18, 0.22),
  medium: rgb(0.4, 0.44, 0.49),
  light: rgb(0.62, 0.65, 0.69),
  faint: rgb(0.88, 0.89, 0.91),
  white: rgb(1, 1, 1),
  brand: rgb(0.31, 0.27, 0.9),
  emerald: rgb(0.02, 0.37, 0.27),
  emeraldBg: rgb(0.88, 0.97, 0.92),
  emeraldBorder: rgb(0.73, 0.93, 0.82),
  riskLow: rgb(0.02, 0.37, 0.27),
  riskModerate: rgb(0.57, 0.25, 0.05),
  riskHigh: rgb(0.62, 0.07, 0.22),
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

  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 56;
  const contentW = width - margin * 2;
  let y = height - margin;

  // ── Helper: draw text ──────────────────────────────────────
  function drawText(
    text: string,
    x: number,
    yPos: number,
    opts: { font?: typeof helvetica; size?: number; color?: ReturnType<typeof rgb>; maxWidth?: number } = {}
  ) {
    const font = opts.font ?? helvetica;
    const size = opts.size ?? 10;
    const color = opts.color ?? COLORS.dark;
    page.drawText(text, { x, y: yPos, size, font, color });
  }

  // ── Helper: wrap text into lines ───────────────────────────
  function wrapText(text: string, font: typeof helvetica, size: number, maxWidth: number): string[] {
    const words = text.replace(/\n/g, " ").split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // ── Helper: section label ──────────────────────────────────
  function drawLabel(label: string, yPos: number): number {
    drawText(label.toUpperCase(), margin, yPos, {
      font: helveticaBold,
      size: 7.5,
      color: COLORS.light,
    });
    return yPos - 14;
  }

  // ── Helper: draw a rounded rect ────────────────────────────
  function drawRoundedRect(
    x: number,
    yPos: number,
    w: number,
    h: number,
    opts: { fill?: ReturnType<typeof rgb>; border?: ReturnType<typeof rgb>; borderWidth?: number } = {}
  ) {
    if (opts.fill) {
      page.drawRectangle({ x, y: yPos, width: w, height: h, color: opts.fill });
    }
    if (opts.border) {
      page.drawRectangle({
        x,
        y: yPos,
        width: w,
        height: h,
        borderColor: opts.border,
        borderWidth: opts.borderWidth ?? 0.75,
      });
    }
  }

  // ── Helper: horizontal rule ────────────────────────────────
  function drawHr(yPos: number): number {
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 0.75,
      color: COLORS.faint,
    });
    return yPos - 24;
  }

  // ═══════════════════════════════════════════════════════════
  //  HEADER
  // ═══════════════════════════════════════════════════════════

  // Logo square
  page.drawRectangle({
    x: margin,
    y: y - 24,
    width: 28,
    height: 28,
    color: COLORS.black,
  });
  drawText("H", margin + 9.5, y - 18, {
    font: helveticaBold,
    size: 14,
    color: COLORS.white,
  });

  // Org name + subtitle
  drawText(organizationName, margin + 36, y - 10, {
    font: helveticaBold,
    size: 13,
    color: COLORS.black,
  });
  drawText("Human In The Loop", margin + 36, y - 23, {
    font: helvetica,
    size: 8,
    color: COLORS.light,
  });

  // Right side: record ID
  const idLabel = "AI USAGE RECORD";
  const idValue = record.id.slice(0, 8).toUpperCase();
  const idLabelW = helveticaBold.widthOfTextAtSize(idLabel, 7.5);
  const idValueW = helvetica.widthOfTextAtSize(idValue, 9);
  drawText(idLabel, width - margin - idLabelW, y - 8, {
    font: helveticaBold,
    size: 7.5,
    color: COLORS.light,
  });
  drawText(idValue, width - margin - idValueW, y - 22, {
    font: helvetica,
    size: 9,
    color: COLORS.medium,
  });

  y -= 44;
  y = drawHr(y);

  // ═══════════════════════════════════════════════════════════
  //  STATUS BANNER
  // ═══════════════════════════════════════════════════════════

  const bannerH = 32;
  drawRoundedRect(margin, y - bannerH, contentW, bannerH, {
    fill: COLORS.emeraldBg,
    border: COLORS.emeraldBorder,
  });

  const statusText = "RECORDED — IMMUTABLE";
  const statusW = helveticaBold.widthOfTextAtSize(statusText, 9);
  drawText(statusText, margin + (contentW - statusW) / 2, y - bannerH + 12, {
    font: helveticaBold,
    size: 9,
    color: COLORS.emerald,
  });

  y -= bannerH + 28;

  // ═══════════════════════════════════════════════════════════
  //  AI TOOL USED
  // ═══════════════════════════════════════════════════════════

  y = drawLabel("AI Tool Used", y);
  drawText(record.aiToolUsed, margin, y, {
    font: helveticaBold,
    size: 12,
    color: COLORS.black,
  });
  y -= 28;

  // ═══════════════════════════════════════════════════════════
  //  INTENDED USE
  // ═══════════════════════════════════════════════════════════

  y = drawLabel("Intended Use", y);
  const useLines = wrapText(record.intendedUseDescription, helvetica, 10, contentW);
  for (const line of useLines) {
    drawText(line, margin, y, { size: 10, color: COLORS.dark });
    y -= 15;
  }
  y -= 12;

  // ═══════════════════════════════════════════════════════════
  //  STRUCTURED INPUTS & RISK (three columns + risk)
  // ═══════════════════════════════════════════════════════════

  const col4W = contentW / 4;

  // Distribution
  drawText("DISTRIBUTION", margin, y, {
    font: helveticaBold,
    size: 7.5,
    color: COLORS.light,
  });
  drawText(DISTRIBUTION_LABELS[record.distributionContext], margin, y - 14, {
    font: helveticaBold,
    size: 11,
    color: COLORS.black,
  });

  // Sensitive Data
  drawText("SENSITIVE DATA", margin + col4W, y, {
    font: helveticaBold,
    size: 7.5,
    color: COLORS.light,
  });
  drawText(record.dataSensitivity ? "Yes" : "No", margin + col4W, y - 14, {
    font: helveticaBold,
    size: 11,
    color: COLORS.black,
  });

  // High-Stakes
  drawText("HIGH-STAKES", margin + col4W * 2, y, {
    font: helveticaBold,
    size: 7.5,
    color: COLORS.light,
  });
  drawText(record.highStakesDecision ? "Yes" : "No", margin + col4W * 2, y - 14, {
    font: helveticaBold,
    size: 11,
    color: COLORS.black,
  });

  // Risk level
  drawText("RISK LEVEL", margin + col4W * 3, y, {
    font: helveticaBold,
    size: 7.5,
    color: COLORS.light,
  });

  const riskText = record.riskLevel ? RISK_LABELS[record.riskLevel] : "—";
  const riskColor = record.riskLevel === "LOW"
    ? COLORS.riskLow
    : record.riskLevel === "MODERATE"
      ? COLORS.riskModerate
      : COLORS.riskHigh;

  drawText(riskText, margin + col4W * 3, y - 14, {
    font: helveticaBold,
    size: 11,
    color: record.riskLevel ? riskColor : COLORS.medium,
  });

  y -= 42;

  // ═══════════════════════════════════════════════════════════
  //  RISK ASSESSMENT (if present)
  // ═══════════════════════════════════════════════════════════

  if (record.riskJustification) {
    y = drawLabel("Risk Assessment", y);

    const justLines = wrapText(record.riskJustification, helvetica, 9.5, contentW - 20);
    const blockH = justLines.length * 14 + 16;

    drawRoundedRect(margin, y - blockH + 6, contentW, blockH, {
      fill: rgb(0.97, 0.97, 0.98),
      border: COLORS.faint,
    });

    let lineY = y - 4;
    for (const line of justLines) {
      drawText(line, margin + 10, lineY, { size: 9.5, color: COLORS.medium });
      lineY -= 14;
    }

    y -= blockH + 16;
  }

  // ═══════════════════════════════════════════════════════════
  //  REVIEW COMMENT (if present)
  // ═══════════════════════════════════════════════════════════

  if (record.reviewComment) {
    y = drawLabel("Review Comment", y);

    const commentLines = wrapText(`"${record.reviewComment}"`, helvetica, 9.5, contentW - 20);
    const commentBlockH = commentLines.length * 14 + 16;

    drawRoundedRect(margin, y - commentBlockH + 6, contentW, commentBlockH, {
      fill: rgb(0.97, 0.97, 0.98),
      border: COLORS.faint,
    });

    let lineY = y - 4;
    for (const line of commentLines) {
      drawText(line, margin + 10, lineY, { size: 9.5, color: COLORS.medium });
      lineY -= 14;
    }

    if (record.reviewer) {
      y -= commentBlockH + 2;
      drawText(`— ${record.reviewer.fullName}`, margin + 10, y, {
        size: 8,
        color: COLORS.light,
      });
      y -= 20;
    } else {
      y -= commentBlockH + 16;
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  FOOTER — People & Dates
  // ═══════════════════════════════════════════════════════════

  y = drawHr(y);

  const col3W = contentW / 3;

  // Created By
  drawText("CREATED BY", margin, y, {
    font: helveticaBold,
    size: 7.5,
    color: COLORS.light,
  });
  drawText(record.creator.fullName, margin, y - 14, {
    font: helveticaBold,
    size: 10,
    color: COLORS.black,
  });

  // Reviewed By
  const reviewerLabel = "REVIEWED BY";
  const reviewerCenterX = margin + col3W;
  drawText(reviewerLabel, reviewerCenterX, y, {
    font: helveticaBold,
    size: 7.5,
    color: COLORS.light,
  });
  drawText(record.reviewer?.fullName ?? "Auto-approved", reviewerCenterX, y - 14, {
    font: helveticaBold,
    size: 10,
    color: COLORS.black,
  });

  // Recorded date
  const recordedLabel = "RECORDED";
  const recordedCenterX = margin + col3W * 2;
  drawText(recordedLabel, recordedCenterX, y, {
    font: helveticaBold,
    size: 7.5,
    color: COLORS.light,
  });
  drawText(formatDate(record.recordedAt), recordedCenterX, y - 14, {
    font: helveticaBold,
    size: 10,
    color: COLORS.black,
  });

  y -= 48;

  // ═══════════════════════════════════════════════════════════
  //  WATERMARK
  // ═══════════════════════════════════════════════════════════

  const watermark = "This document was generated by Human In The Loop";
  const watermarkW = helvetica.widthOfTextAtSize(watermark, 7);
  drawText(watermark, (width - watermarkW) / 2, y, {
    size: 7,
    color: COLORS.faint,
  });

  return doc.save();
}
