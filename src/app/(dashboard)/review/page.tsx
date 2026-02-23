import { requireRole } from "@/lib/dal/auth";
import { getSubmittedRecordsForReview, getRecordsByOrg } from "@/lib/dal/records";
import { ReviewQueueTable } from "@/components/review/review-queue-table";

export default async function ReviewPage() {
  const user = await requireRole("REVIEWER", "ADMIN");

  const submittedRecords = await getSubmittedRecordsForReview(user.organizationId);
  const approvedRecords = await getRecordsByOrg(user.organizationId, { status: "APPROVED" });

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Review Queue</h1>
        <p className="mt-1 text-sm text-on-surface-secondary">
          Records awaiting your review
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
            Pending Review ({submittedRecords.length})
          </h2>
          <ReviewQueueTable records={submittedRecords} />
        </div>

        {approvedRecords.length > 0 && (
          <div>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
              Approved &mdash; Awaiting Finalization ({approvedRecords.length})
            </h2>
            <ReviewQueueTable records={approvedRecords} />
          </div>
        )}
      </div>
    </div>
  );
}
