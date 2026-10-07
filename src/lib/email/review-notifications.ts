import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

export async function notifyReviewWorkflow(
  recordId: string,
  organizationId: string,
  status: "SUBMITTED" | "APPROVED" | "REJECTED",
  reviewComment?: string,
): Promise<void> {
  // Catch configuration, recipient-query and provider errors alike. Notification
  // failures must never change the result of a successful lifecycle transition.
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set — skipping review notification");
      return;
    }
    // Same Resend setup as invites, inside the guard so missing credentials
    // or client initialization failures cannot prevent a transition.
    const resend = new Resend(process.env.RESEND_API_KEY);
    const record = await prisma.record.findFirst({
      where: { id: recordId, organizationId },
      include: { creator: { select: { email: true } }, organization: { select: { name: true } } },
    });
    if (!record) return;
    const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.humaninntheloop.com");
    if (origin.protocol !== "https:") throw new Error("Notification site URL must use HTTPS");
    const link = new URL(`/permission-slips/${recordId}`, origin).href;
    const recipients = status === "SUBMITTED"
      ? await prisma.user.findMany({
          where: { organizationId, isActive: true, role: { in: ["REVIEWER", "ADMIN"] } },
          select: { email: true },
        })
      : [record.creator];
    const subject = status === "SUBMITTED"
      ? "New reliance record awaiting review"
      : `Reliance record ${status.toLowerCase()}`;
    const text = status === "SUBMITTED"
      ? `A new reliance record is awaiting review.\n\n${link}`
      : `Your reliance record was ${status.toLowerCase()}.\n\nReview comment: ${reviewComment ?? record.reviewComment ?? "No comment provided."}\n\n${link}`;
    // Send separately so recipients' addresses are not exposed to one another.
    for (const { email } of recipients) {
      try {
        const { error } = await resend.emails.send({
          from: `${record.organization.name} <semrebayrak@gmail.com>`,
          to: email, subject, text,
        });
        if (error) console.error("Resend review notification error:", error);
      } catch (error) {
        console.error("Failed to send review notification:", error);
      }
    }
  } catch (error) {
    console.error("Review notification failed:", error);
  }
}
