import { requireRole } from "@/lib/dal/auth";
import { listApiKeys } from "@/lib/actions/api-key-actions";
import { ApiKeysManager } from "@/components/admin/api-keys-manager";

export default async function ApiKeysPage() {
  await requireRole("ADMIN");
  const result = await listApiKeys();
  if (!result.success) throw new Error(result.error);
  return <ApiKeysManager initialKeys={result.data} />;
}
