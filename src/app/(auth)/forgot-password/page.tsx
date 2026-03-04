"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/actions/auth-actions";
import {
  ArrowLeft,
  ArrowRight,
  SpinnerGap,
  EnvelopeOpen,
  WarningCircle,
} from "@phosphor-icons/react";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const result = await forgotPassword(formData);
    if (result.success) {
      setSubmittedEmail(email);
      setSuccess(true);
      setCooldown(60);
    } else {
      setError(result.error);
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
    }
    setLoading(false);
  }

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || !submittedEmail) return;
    setCooldown(60);
    const formData = new FormData();
    formData.set("email", submittedEmail);
    await forgotPassword(formData);
  }, [cooldown, submittedEmail]);

  if (success) {
    return (
      <div className="animate-fade-in-up text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
          <EnvelopeOpen className="h-7 w-7 text-zinc-600" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-on-surface">
          Check your email
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-on-surface-tertiary">
          If an account exists with that email, we&apos;ve sent a password reset
          link. It may take a minute to arrive.
        </p>

        {/* Resend with cooldown */}
        <div className="mt-6">
          {cooldown > 0 ? (
            <p className="text-[13px] text-on-surface-quaternary">
              Didn&apos;t receive it? Resend in{" "}
              <span className="font-medium text-on-surface-tertiary tabular-nums">
                {cooldown}s
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-[13px] font-medium text-zinc-600 transition-colors hover:text-zinc-800"
            >
              Didn&apos;t receive it? Resend
            </button>
          )}
        </div>

        <div className="my-8 h-px bg-border-subtle" />

        <Link
          href="/login"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border-default bg-surface text-sm font-medium text-on-surface transition-all duration-150 hover:bg-surface-inset"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Back link */}
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-on-surface-quaternary transition-colors hover:text-on-surface-secondary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to sign in
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-on-surface-tertiary">
          Enter your email and we&apos;ll send you a link to reset your
          password.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className={`space-y-4 ${shakeForm ? "animate-shake" : ""}`}
      >
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <WarningCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-[13px] font-medium text-on-surface"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="block h-10 w-full rounded-lg border border-input-border bg-input-bg px-3.5 text-sm text-on-surface transition-all duration-150 placeholder:text-on-surface-quaternary hover:border-input-border-hover focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20"
            placeholder="you@company.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-zinc-800 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
        >
          {loading ? (
            <>
              <SpinnerGap className="h-4 w-4 animate-spin" />
              Sending link...
            </>
          ) : (
            <>
              Send reset link
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
