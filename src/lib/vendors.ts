import { prisma } from "@/lib/prisma";
import type { RiskLevel } from "@/generated/prisma";

export interface MatchedVendor {
  id: string;
  name: string;
  riskTier: RiskLevel;
}

/**
 * Match record/extension tool names (e.g. "CHATGPT", "Claude") against active
 * vendors' toolAliases, case-insensitively. Returns every active vendor that
 * matches at least one of the given tool names.
 */
export async function matchVendors(toolNames: string[]): Promise<MatchedVendor[]> {
  if (toolNames.length === 0) return [];
  const lowered = toolNames.map((t) => t.toLowerCase());
  const vendors = await prisma.aiVendor.findMany({ where: { isActive: true } });
  return vendors
    .filter((v) => v.toolAliases.some((alias) => lowered.includes(alias.toLowerCase())))
    .map((v) => ({ id: v.id, name: v.name, riskTier: v.riskTier }));
}

const TIER_ORDER: RiskLevel[] = ["LOW", "MODERATE", "HIGH"];

/**
 * Highest risk tier among the vendors matched for the given tool names.
 * Returns null when no active vendor matches (classification is unaffected).
 */
export async function getHighestVendorTier(
  toolNames: string[]
): Promise<{ tier: RiskLevel; names: string[] } | null> {
  const matched = await matchVendors(toolNames);
  if (matched.length === 0) return null;
  const tier = matched
    .map((m) => m.riskTier)
    .sort((a, b) => TIER_ORDER.indexOf(b) - TIER_ORDER.indexOf(a))[0];
  return {
    tier,
    names: matched.filter((m) => m.riskTier === tier).map((m) => m.name),
  };
}
