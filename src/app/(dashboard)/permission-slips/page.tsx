import Link from "next/link";
import { requireAuth } from "@/lib/dal/auth";
import { getRecordsByOrg } from "@/lib/dal/records";
import { getUsersByOrg } from "@/lib/dal/users";
import { RecordCard } from "@/components/records/record-card";
import { RecordFilters } from "@/components/records/record-filters";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "@phosphor-icons/react/ssr";
import type { RecordStatus } from "@/types";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "RECORDED"]);

interface RecordsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RecordsPage({ searchParams }: RecordsPageProps) {
  const user = await requireAuth();
  const params = await searchParams;

  // Parse filter params
  const statusParam = typeof params.status === "string" && VALID_STATUSES.has(params.status)
    ? (params.status as RecordStatus)
    : undefined;
  const creatorParam = typeof params.creator === "string" ? params.creator : undefined;
  const fromParam = typeof params.from === "string" ? params.from : undefined;
  const toParam = typeof params.to === "string" ? params.to : undefined;

  // Build filter options
  const filterCreatorId = user.role === "EMPLOYEE"
    ? user.id
    : creatorParam || undefined;

  const dateFrom = fromParam ? new Date(`${fromParam}T00:00:00`) : undefined;
  const dateTo = toParam ? new Date(`${toParam}T23:59:59.999`) : undefined;

  const [records, users] = await Promise.all([
    getRecordsByOrg(user.organizationId, {
      status: statusParam,
      creatorId: filterCreatorId,
      dateFrom,
      dateTo,
    }),
    user.role !== "EMPLOYEE"
      ? getUsersByOrg(user.organizationId)
      : Promise.resolve([]),
  ]);

  const showCreatorFilter = user.role !== "EMPLOYEE";

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">AI Permission Slips</h1>
          <p className="mt-1 text-sm text-on-surface-secondary">
            {user.role === "EMPLOYEE"
              ? "Your permission slips"
              : "All organization permission slips"}
          </p>
        </div>
        <Link href="/permission-slips/new">
          <Button>
            <Plus className="h-4 w-4" />
            Create AI Permission Slip
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <RecordFilters
          users={users.map((u) => ({ id: u.id, fullName: u.fullName }))}
          showCreatorFilter={showCreatorFilter}
        />
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-elevated py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-inset">
            <FileText className="h-7 w-7 text-on-surface-quaternary" />
          </div>
          <p className="mt-4 text-sm font-medium text-on-surface-secondary">No permission slips found</p>
          <p className="mt-1 text-sm text-on-surface-quaternary">
            {statusParam || creatorParam || fromParam || toParam
              ? "Try adjusting your filters."
              : "Submit your first permission slip to get started."}
          </p>
          {!statusParam && !creatorParam && !fromParam && !toParam && (
            <Link href="/permission-slips/new" className="mt-5">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Create AI Permission Slip
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}
