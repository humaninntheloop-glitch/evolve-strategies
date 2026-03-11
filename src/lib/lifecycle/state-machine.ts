import type { RecordStatus, UserRole } from "@/generated/prisma";

export interface TransitionContext {
  currentStatus: RecordStatus;
  targetStatus: RecordStatus;
  actorRole: UserRole;
  actorId: string;
  creatorId: string;
  reviewComment?: string;
}

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
}

interface TransitionRule {
  from: RecordStatus;
  to: RecordStatus;
  allowedRoles: UserRole[];
  condition?: (ctx: TransitionContext) => TransitionResult;
}

const TRANSITION_RULES: TransitionRule[] = [
  {
    from: "DRAFT",
    to: "SUBMITTED",
    allowedRoles: ["EMPLOYEE", "ADMIN"],
    condition: (ctx) => {
      if (ctx.actorId !== ctx.creatorId) {
        return { allowed: false, reason: "Only the creator can submit their own permission slip" };
      }
      return { allowed: true };
    },
  },
  {
    from: "SUBMITTED",
    to: "APPROVED",
    allowedRoles: ["REVIEWER", "ADMIN"],
    condition: (ctx) => {
      if (ctx.actorId === ctx.creatorId) {
        return { allowed: false, reason: "Cannot approve your own permission slip" };
      }
      return { allowed: true };
    },
  },
  {
    from: "SUBMITTED",
    to: "REJECTED",
    allowedRoles: ["REVIEWER", "ADMIN"],
    condition: (ctx) => {
      if (ctx.actorId === ctx.creatorId) {
        return { allowed: false, reason: "Cannot reject your own permission slip" };
      }
      if (!ctx.reviewComment?.trim()) {
        return { allowed: false, reason: "A comment is required when rejecting a permission slip" };
      }
      return { allowed: true };
    },
  },
  {
    from: "APPROVED",
    to: "RECORDED",
    allowedRoles: ["REVIEWER", "ADMIN"],
  },
];

export function validateTransition(ctx: TransitionContext): TransitionResult {
  if (ctx.currentStatus === "RECORDED") {
    return { allowed: false, reason: "RECORDED is a final state — no transitions allowed" };
  }

  const rule = TRANSITION_RULES.find(
    (r) => r.from === ctx.currentStatus && r.to === ctx.targetStatus
  );

  if (!rule) {
    return {
      allowed: false,
      reason: `Invalid transition: ${ctx.currentStatus} → ${ctx.targetStatus}`,
    };
  }

  if (!rule.allowedRoles.includes(ctx.actorRole)) {
    return {
      allowed: false,
      reason: `Role ${ctx.actorRole} cannot perform this transition`,
    };
  }

  if (rule.condition) {
    return rule.condition(ctx);
  }

  return { allowed: true };
}

export function getAvailableTransitions(
  currentStatus: RecordStatus,
  actorRole: UserRole,
  actorId: string,
  creatorId: string
): RecordStatus[] {
  return TRANSITION_RULES.filter((rule) => {
    if (rule.from !== currentStatus) return false;
    if (!rule.allowedRoles.includes(actorRole)) return false;
    if (rule.condition) {
      // Pass a placeholder comment so the reject condition doesn't
      // hide the button — the actual comment is validated at submit time
      const result = rule.condition({
        currentStatus,
        targetStatus: rule.to,
        actorRole,
        actorId,
        creatorId,
        reviewComment: "__availability_check__",
      });
      return result.allowed;
    }
    return true;
  }).map((rule) => rule.to);
}
