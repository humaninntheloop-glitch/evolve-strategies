"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/actions/auth-actions";
import { ArrowRight, SpinnerGap, Eye, EyeSlash, WarningCircle } from "@phosphor-icons/react";

const DEMO_ACCOUNTS = [
  { email: "admin@vizio.ai", password: "Vizio2026!", label: "Admin", role: "Organization Admin" },
  { email: "review@vizio.ai", password: "Vizio2026!", label: "Reviewer", role: "AI Reviewer" },
  { email: "employee@vizio.ai", password: "Vizio2026!", label: "Employee", role: "Employee" },
];

function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const authError = errorParam === "auth"
    ? "Your sign-in link has expired or is invalid. Please try again."
    : errorParam === "no-account"
      ? "No account found for this email. Contact your organization administrator for access."
      : null;
  const [error, setError] = useState<string | null>(authError);
  const [loading, setLoading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await login(formData);
    if (result && !result.success) {
      setError(result.error);
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      setLoading(false);
    }
  }

  async function handleDemoLogin(account: typeof DEMO_ACCOUNTS[number]) {
    setLoadingDemo(account.email);
    setError(null);
    const formData = new FormData();
    formData.set("email", account.email);
    formData.set("password", account.password);
    const result = await login(formData);
    if (result && !result.success) {
      setError(result.error);
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      setLoadingDemo(null);
    }
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">
          Sign in to your account
        </h1>
        <p className="mt-2 text-sm text-on-surface-tertiary">
          Welcome back. Enter your credentials to continue.
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
            Email
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-[13px] font-medium text-on-surface"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[12px] font-medium text-zinc-500 transition-colors hover:text-zinc-700"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              className="block h-10 w-full rounded-lg border border-input-border bg-input-bg px-3.5 pr-10 text-sm text-on-surface transition-all duration-150 placeholder:text-on-surface-quaternary hover:border-input-border-hover focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20"
              placeholder="Enter your password"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-quaternary transition-colors hover:text-on-surface-secondary"
            >
              {showPassword ? (
                <EyeSlash className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-zinc-800 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
        >
          {loading ? (
            <>
              <SpinnerGap className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-border-subtle" />
        <span className="text-xs text-on-surface-quaternary">
          Don&apos;t have an account?
        </span>
        <div className="h-px flex-1 bg-border-subtle" />
      </div>

      {/* Sign up link */}
      <Link
        href="/signup"
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border-default bg-surface text-sm font-medium text-on-surface transition-all duration-150 hover:bg-surface-inset"
      >
        Request access
        <ArrowRight className="h-3.5 w-3.5 text-on-surface-quaternary" />
      </Link>

      {/* Demo Accounts */}
      <div className="mt-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-xs text-on-surface-quaternary">Demo Accounts</span>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              disabled={loading || loadingDemo !== null}
              onClick={() => handleDemoLogin(account)}
              className="flex flex-col items-center gap-1 rounded-lg border border-border-default bg-surface px-3 py-3 text-center transition-all duration-150 hover:bg-surface-inset hover:border-border-strong disabled:pointer-events-none disabled:opacity-60"
            >
              {loadingDemo === account.email ? (
                <SpinnerGap className="h-4 w-4 animate-spin text-on-surface-tertiary" />
              ) : (
                <>
                  <span className="text-sm font-medium text-on-surface">{account.label}</span>
                  <span className="text-[11px] text-on-surface-quaternary">{account.role}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
