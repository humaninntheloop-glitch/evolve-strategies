import type {
  UserRole,
  DataClassification,
  RiskLevel,
  RecordStatus,
} from "@/generated/prisma";

export type { UserRole, DataClassification, RiskLevel, RecordStatus };

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
  intendedUseDescription: string;
  aiToolUsed: string;
  dataClassification: DataClassification;
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

export const CLASSIFICATION_LABELS: Record<DataClassification, string> = {
  PUBLIC: "Public",
  INTERNAL: "Internal",
  CONFIDENTIAL: "Confidential",
  RESTRICTED: "Restricted",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  EMPLOYEE: "Employee",
  REVIEWER: "Reviewer",
};
