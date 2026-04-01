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
  aiToolUsedOther: string | null;
  distributionContext: DistributionContext | null;
  dataSensitivity: boolean;
  highStakesDecision: boolean | null;
  aiJustification: string | null;
  aiOutputImpact: AiOutputImpact | null;
  aiUsageType: string[];
  aiUsageTypeOther: string | null;
  humanReviewPlan: string[];
  humanReviewPlanOther: string | null;
  aiUseJustification: string[];
  aiUseJustificationOther: string | null;
  reviewerDecisionRationale: string | null;
  reviewerDecisionRationaleOther: string | null;
  reviewerValidationReference: string[];
  reviewerValidationReferenceOther: string | null;
  attachmentPath: string | null;
  attachmentName: string | null;
  attachmentSize: number | null;
  attachmentType: string | null;
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
  RECORDED: "Authorized for AI Reliance",
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

export const AI_TOOL_OPTIONS = [
  { value: "CHATGPT", label: "ChatGPT" },
  { value: "MICROSOFT_COPILOT", label: "Microsoft Copilot" },
  { value: "GOOGLE_GEMINI", label: "Google Gemini" },
  { value: "CLAUDE", label: "Claude" },
  { value: "INTERNAL_AI_TOOL", label: "Internal AI Tool" },
] as const;

export const AI_TOOL_LABELS: Record<string, string> = {
  CHATGPT: "ChatGPT",
  MICROSOFT_COPILOT: "Microsoft Copilot",
  GOOGLE_GEMINI: "Google Gemini",
  CLAUDE: "Claude",
  INTERNAL_AI_TOOL: "Internal AI Tool",
  OTHER: "Other",
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

export const AI_USE_JUSTIFICATION_OPTIONS = [
  { value: "EFFICIENCY_DRAFTING", label: "Efficiency or drafting assistance" },
  { value: "SUMMARIZATION", label: "Summarization of large materials" },
  { value: "RESEARCH_SUPPORT", label: "Internal research support" },
  { value: "DATA_ORGANIZATION", label: "Data organization or classification" },
  { value: "DECISION_SUPPORT_VERIFIED", label: "Decision support with human verification" },
] as const;

export const AI_USE_JUSTIFICATION_LABELS: Record<string, string> = {
  EFFICIENCY_DRAFTING: "Efficiency / Drafting Assistance",
  SUMMARIZATION: "Summarization of Large Materials",
  RESEARCH_SUPPORT: "Internal Research Support",
  DATA_ORGANIZATION: "Data Organization / Classification",
  DECISION_SUPPORT_VERIFIED: "Decision Support with Human Verification",
  OTHER: "Other",
};

export const REVIEWER_DECISION_RATIONALE_OPTIONS = [
  { value: "AI_USE_APPROPRIATE", label: "AI use is appropriate for this task" },
  { value: "REVIEW_PLAN_MITIGATES", label: "Human review plan sufficiently mitigates risk" },
  { value: "RISK_ACCEPTABLE", label: "Risk level acceptable for this workflow" },
  { value: "ADDITIONAL_SAFEGUARDS", label: "Additional safeguards applied" },
  { value: "AI_NOT_APPROPRIATE", label: "AI reliance not appropriate for this task" },
] as const;

export const REVIEWER_DECISION_RATIONALE_LABELS: Record<string, string> = {
  AI_USE_APPROPRIATE: "AI Use Appropriate for Task",
  REVIEW_PLAN_MITIGATES: "Human Oversight Plan Mitigates Risk",
  RISK_ACCEPTABLE: "Risk Level Acceptable",
  ADDITIONAL_SAFEGUARDS: "Additional Safeguards Applied",
  AI_NOT_APPROPRIATE: "AI Reliance Not Appropriate",
  OTHER: "Other",
};

export const REVIEWER_VALIDATION_REFERENCE_OPTIONS = [
  { value: "INTERNAL_DOCS", label: "Internal documentation or knowledge base" },
  { value: "SOURCE_MATERIALS", label: "Source materials provided by the requestor" },
  { value: "COMPANY_POLICIES", label: "Company policies or procedures" },
  { value: "LEGAL_REGULATORY", label: "Legal or regulatory guidance" },
  { value: "HUMAN_VERIFICATION", label: "Independent human verification" },
  { value: "MULTIPLE_SOURCES", label: "Multiple sources of validation" },
] as const;

export const REVIEWER_VALIDATION_REFERENCE_LABELS: Record<string, string> = {
  INTERNAL_DOCS: "Internal Documentation / Knowledge Base",
  SOURCE_MATERIALS: "Source Materials from Requestor",
  COMPANY_POLICIES: "Company Policies / Procedures",
  LEGAL_REGULATORY: "Legal / Regulatory Guidance",
  HUMAN_VERIFICATION: "Independent Human Verification",
  MULTIPLE_SOURCES: "Multiple Sources of Validation",
  OTHER: "Other",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  EMPLOYEE: "Employee",
  REVIEWER: "Reviewer",
};
