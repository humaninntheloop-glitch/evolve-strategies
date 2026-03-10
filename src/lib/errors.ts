import { Prisma } from "@/generated/prisma";

const FRIENDLY_MESSAGES: Record<string, string> = {
  // Prisma error codes
  P2002: "A record with this information already exists.",
  P2003: "This record is referenced by other data and cannot be modified.",
  P2025: "The record you're trying to update no longer exists.",
};

const SUPABASE_PATTERNS: [RegExp, string][] = [
  [/rate limit/i, "Too many attempts. Please wait a moment and try again."],
  [/for security purposes/i, "Too many attempts. Please wait a moment and try again."],
  [/already registered/i, "A user with this email already exists."],
  [/email.*taken/i, "A user with this email already exists."],
  [/email_exists/i, "A user with this email already exists."],
  [/invalid.*credentials/i, "Invalid email or password."],
  [/password.*weak/i, "Password is too weak. Please choose a stronger one."],
];

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

export function handleActionError(error: unknown): string {
  console.error("Action error:", error);

  // Prisma known request errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const friendly = FRIENDLY_MESSAGES[error.code];
    if (friendly) return friendly;
  }

  // String or Error-like messages (e.g. Supabase auth errors)
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  // Supabase AuthApiError includes a `code` property (e.g. "email_exists")
  const code = (error as { code?: string })?.code ?? "";
  const matchStr = `${message} ${code}`;

  if (matchStr.trim()) {
    for (const [pattern, friendly] of SUPABASE_PATTERNS) {
      if (pattern.test(matchStr)) return friendly;
    }
  }

  // Network / fetch errors
  if (error instanceof TypeError && message.includes("fetch")) {
    return "Unable to connect. Please check your internet connection and try again.";
  }

  return DEFAULT_MESSAGE;
}
