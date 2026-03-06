import type {
  UserRole,
  DistributionContext,
  AiOutputImpact,
  RiskLevel,
  RecordStatus,
} from "@/generated/prisma";

export type { UserRole, DistributionContext, AiOutputImpact, RiskLevel, RecordStatus };

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  isDemo: boolean;
}

export interface RecordWithRelations {
  id: string;
  organizationId: string;
  creatorId: string;
  reviewerId: string | null;
  intendedUseDescription: string | null;
  aiToolUsed: string;
  distributionContext: DistributionContext | null;
  dataSensitivity: boolean;
  highStakesDecision: boolean | null;
  aiJustification: string | null;
  aiOutputImpact: AiOutputImpact | null;
  aiUsageType: string[];
  aiUsageTypeOther: string | null;
  humanReviewPlan: string[];
  humanReviewPlanOther: string | null;
  aiSummary: string | null;
  riskLevel: RiskLevel | null;
  riskJustification: string | null;
  status: RecordStatus;
  reviewComment: string | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  recordedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  creator: { id: string; fullName: string; email: string };
  reviewer: { id: string; fullName: string; email: string } | null;
}

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  recordId: string;
  actionType: string;
  actorId: string;
  previousState: string | null;
  newState: string | null;
  metadata: Record<string, unknown> | null;
  timestamp: Date;
  actor: { fullName: string; email: string };
}

export interface DashboardStats {
  totalRecords: number;
  draftRecords: number;
  submittedRecords: number;
  approvedRecords: number;
  rejectedRecords: number;
  recordedRecords: number;
  pendingReview: number;
}

export const STATUS_LABELS: Record<RecordStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RECORDED: "Recorded",
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
};

export const DISTRIBUTION_LABELS: Record<DistributionContext, string> = {
  INTERNAL: "Internal",
  EXTERNAL: "External",
};

export const AI_OUTPUT_IMPACT_LABELS: Record<AiOutputImpact, string> = {
  INTERNAL_NOTES: "Internal Notes / Brainstorming",
  INTERNAL_RESEARCH: "Internal Research / Analysis",
  INTERNAL_DOCUMENT: "Internal Document Drafting",
  CLIENT_COMMUNICATION: "Customer / Client Communication",
  EXTERNAL_REPORTS: "External Reports / Deliverables",
  FINANCIAL_LEGAL: "Financial / Legal Decisions",
  REGULATORY_COMPLIANCE: "Regulatory / Compliance / Contractual",
};

export const AI_USAGE_TYPE_OPTIONS = [
  { value: "DRAFTING", label: "Drafting assistance" },
  { value: "SUMMARIZING", label: "Summarizing existing information" },
  { value: "RESEARCH", label: "Internal research or analysis" },
  { value: "DATA_CLASSIFICATION", label: "Data classification or organization" },
  { value: "DECISION_SUPPORT", label: "Decision support" },
] as const;

export const AI_USAGE_TYPE_LABELS: Record<string, string> = {
  DRAFTING: "Drafting Assistance",
  SUMMARIZING: "Summarizing Information",
  RESEARCH: "Internal Research / Analysis",
  DATA_CLASSIFICATION: "Data Classification / Organization",
  DECISION_SUPPORT: "Decision Support",
  // Legacy values
  CONTENT_DRAFTING: "Content Drafting",
  DATA_ANALYSIS: "Data Analysis",
  CODE_GENERATION: "Code Generation",
  TRANSLATION: "Translation",
  OTHER: "Other",
};

export const HUMAN_REVIEW_PLAN_OPTIONS = [
  { value: "REQUESTOR_REVIEW", label: "The requestor will review and verify the output" },
  { value: "SUPERVISOR_REVIEW", label: "A supervisor or team lead will review the output" },
  { value: "SOURCE_CROSSCHECK", label: "The output will be cross-checked against source materials" },
  { value: "POLICY_VALIDATION", label: "The output will be validated against internal policies or procedures" },
  { value: "MULTI_LEVEL_REVIEW", label: "The output will undergo multiple levels of review before external use" },
] as const;

export const HUMAN_REVIEW_PLAN_LABELS: Record<string, string> = {
  REQUESTOR_REVIEW: "Requestor Review & Verification",
  SUPERVISOR_REVIEW: "Supervisor / Team Lead Review",
  SOURCE_CROSSCHECK: "Cross-checked Against Source Materials",
  POLICY_VALIDATION: "Validated Against Internal Policies",
  MULTI_LEVEL_REVIEW: "Multiple Levels of Review",
  // Legacy values
  FULL_REVIEW: "Full Manual Review",
  SPOT_CHECK: "Spot Check / Sampling",
  EXPERT_REVIEW: "Subject Matter Expert Review",
  AUTOMATED_CHECK: "Automated Validation",
  PEER_REVIEW: "Peer Review",
  OTHER: "Other",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  EMPLOYEE: "Employee",
  REVIEWER: "Reviewer",
};
