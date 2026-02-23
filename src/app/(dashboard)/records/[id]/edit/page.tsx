import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/dal/auth";
import { getRecordById } from "@/lib/dal/records";
import { RecordForm } from "@/components/records/record-form";

interface EditRecordPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecordPage({ params }: EditRecordPageProps) {
  const { id } = await params;
  const user = await requireAuth();

  const record = await getRecordById(id, user.organizationId);
  if (!record) notFound();

  if (record.status !== "DRAFT") {
    redirect(`/records/${id}`);
  }

  if (record.creatorId !== user.id && user.role !== "ADMIN") {
    notFound();
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Edit Record</h1>
        <p className="mt-1 text-sm text-on-surface-secondary">
          Update your draft record before submitting for review.
        </p>
      </div>
      <div className="max-w-2xl">
        <RecordForm record={record} />
      </div>
    </div>
  );
}
