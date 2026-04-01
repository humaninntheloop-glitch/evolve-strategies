import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/dal/auth";
import { prisma } from "@/lib/prisma";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/csv",
]);

const BUCKET = "record-attachments";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ── POST: Upload attachment ──────────────────────────────────
export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const user = await requireAuth();

  const record = await prisma.record.findFirst({
    where: { id, organizationId: user.organizationId },
    select: { id: true, status: true, creatorId: true, organizationId: true, attachmentPath: true },
  });

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (record.status !== "DRAFT") {
    return NextResponse.json({ error: "Only draft records can have attachments" }, { status: 400 });
  }
  if (record.creatorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "File type not supported" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Remove existing attachment if any
  if (record.attachmentPath) {
    await supabase.storage.from(BUCKET).remove([record.attachmentPath]);
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${record.organizationId}/${record.id}/${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Supabase upload error:", uploadError);
    const message = uploadError.message?.includes("not found")
      ? "Storage bucket not configured. Please create the 'record-attachments' bucket in Supabase."
      : `Upload failed: ${uploadError.message}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await prisma.record.update({
    where: { id: record.id },
    data: {
      attachmentPath: filePath,
      attachmentName: file.name,
      attachmentSize: file.size,
      attachmentType: file.type,
    },
  });

  return NextResponse.json({ success: true });
}

// ── GET: Download attachment ─────────────────────────────────
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const user = await requireAuth();

  const record = await prisma.record.findFirst({
    where: { id, organizationId: user.organizationId },
    select: { id: true, creatorId: true, attachmentPath: true, attachmentName: true },
  });

  if (!record || !record.attachmentPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (user.role === "EMPLOYEE" && record.creatorId !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(record.attachmentPath, 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}

// ── DELETE: Remove attachment ────────────────────────────────
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const user = await requireAuth();

  const record = await prisma.record.findFirst({
    where: { id, organizationId: user.organizationId },
    select: { id: true, status: true, creatorId: true, attachmentPath: true },
  });

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (record.status !== "DRAFT") {
    return NextResponse.json({ error: "Only draft records can have attachments removed" }, { status: 400 });
  }
  if (record.creatorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (record.attachmentPath) {
    const supabase = createServiceClient();
    await supabase.storage.from(BUCKET).remove([record.attachmentPath]);
  }

  await prisma.record.update({
    where: { id: record.id },
    data: {
      attachmentPath: null,
      attachmentName: null,
      attachmentSize: null,
      attachmentType: null,
    },
  });

  return NextResponse.json({ success: true });
}
