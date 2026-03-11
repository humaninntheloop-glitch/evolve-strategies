import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface InviteEmailParams {
  to: string;
  fullName: string;
  organizationName: string;
  setupLink: string;
}

export async function sendInviteEmail({
  to,
  fullName,
  organizationName,
  setupLink,
}: InviteEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping invite email");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const { error } = await resend.emails.send({
      from: `${organizationName} <semrebayrak@gmail.com>`,
      to,
      subject: `You've been invited to ${organizationName}`,
      html: buildInviteHtml({ fullName, organizationName, setupLink }),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to send invite email:", err);
    return { success: false, error: "Failed to send email" };
  }
}

function buildInviteHtml({
  fullName,
  organizationName,
  setupLink,
}: Omit<InviteEmailParams, "to">): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <h2 style="color: #1a1a2e; font-size: 20px; margin-bottom: 16px;">Welcome to ${organizationName}</h2>
      <p style="color: #444; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">
        Hi ${fullName},
      </p>
      <p style="color: #444; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
        You've been invited to join <strong>${organizationName}</strong> on the AI Governance platform. Click the button below to set your password and get started.
      </p>
      <a href="${setupLink}" style="display: inline-block; background-color: #4f46e5; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">
        Set Up Your Account
      </a>
      <p style="color: #888; font-size: 13px; line-height: 1.5; margin-top: 24px;">
        This link expires in 24 hours. If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  `;
}
