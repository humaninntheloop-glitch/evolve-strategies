import { requireRole } from "@/lib/dal/auth";
import { listVendors } from "@/lib/actions/vendor-actions";
import { VendorsManager } from "@/components/admin/vendors-manager";

export default async function VendorsPage() {
  await requireRole("ADMIN");
  const result = await listVendors();
  if (!result.success) throw new Error(result.error);
  return <VendorsManager initialVendors={result.data} />;
}
