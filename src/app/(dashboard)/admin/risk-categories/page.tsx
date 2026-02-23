import { requireRole } from "@/lib/dal/auth";
import { getRiskCategories } from "@/lib/dal/organizations";
import { RiskCategoryForm } from "@/components/admin/risk-category-form";
import { RiskCategoryList } from "./risk-category-list";

export default async function RiskCategoriesPage() {
  const user = await requireRole("ADMIN");
  const categories = await getRiskCategories(user.organizationId);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Risk Categories</h1>
        <p className="mt-1 text-sm text-on-surface-secondary">
          Configure the risk categories for your organization
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
            Existing Categories ({categories.length})
          </h2>
          <RiskCategoryList categories={categories} />
        </div>
        <div>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-on-surface-quaternary">
            Add New
          </h2>
          <RiskCategoryForm />
        </div>
      </div>
    </div>
  );
}
