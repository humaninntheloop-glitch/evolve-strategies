import { requireAuth } from "@/lib/dal/auth";
import { RecordForm } from "@/components/records/record-form";

export default async function NewRecordPage() {
  await requireAuth();

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">New Permission Slip</h1>
        <p className="mt-1 text-sm text-on-surface-secondary">
          Document your intended AI usage before relying on the output.
        </p>
      </div>
      <div className="max-w-2xl">
        <RecordForm />
      </div>
    </div>
  );
}
