"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth-schemas";
import { handleActionError } from "@/lib/errors";
import type { ActionResult } from "@/types";

export async function login(formData: FormData): Promise<ActionResult> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return { success: false, error: "Invalid email or password" };
    }

    // Check DB user exists before redirecting to dashboard
    const { getCurrentUser } = await import("@/lib/dal/auth");
    const user = await getCurrentUser();
    if (!user) {
      await supabase.auth.signOut();
      return {
        success: false,
        error:
          "No account found for this email. Contact your organization administrator for access.",
      };
    }

    redirect("/dashboard");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, error: handleActionError(error) };
  }
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
