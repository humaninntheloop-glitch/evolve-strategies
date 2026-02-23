"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toggleRiskCategory } from "@/lib/actions/admin-actions";
import { ToggleLeft, ToggleRight, Tag } from "@phosphor-icons/react";

interface RiskCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export function RiskCategoryList({ categories }: { categories: RiskCategory[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleToggle(id: string, isActive: boolean) {
    setLoadingId(id);
    await toggleRiskCategory(id, isActive);
    setLoadingId(null);
  }

  if (categories.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center py-6 text-center">
          <Tag className="h-8 w-8 text-on-surface-quaternary" />
          <p className="mt-2 text-sm text-on-surface-quaternary">No risk categories defined yet.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <Card key={cat.id} className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-on-surface">{cat.name}</p>
              <Badge variant={cat.isActive ? "green" : "gray"}>
                {cat.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {cat.description && (
              <p className="mt-1 text-xs text-on-surface-tertiary">{cat.description}</p>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            disabled={loadingId === cat.id}
            onClick={() => handleToggle(cat.id, !cat.isActive)}
          >
            {cat.isActive ? (
              <ToggleRight className="h-4 w-4 text-emerald-500" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-on-surface-quaternary" />
            )}
          </Button>
        </Card>
      ))}
    </div>
  );
}
