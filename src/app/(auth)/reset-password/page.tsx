"use client";

import { useState } from "react";
import { resetPassword } from "@/lib/actions/auth-actions";
import {
  ArrowRight,
  SpinnerGap,
  Eye,
  EyeSlash,
  WarningCircle,
  Check,
  Circle,
  X,
} from "@phosphor-icons/react";

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}

const strengthConfig = [
  { label: "Weak", color: "bg-red-500", textColor: "text-red-500" },
  { label: "Fair", color: "bg-amber-500", textColor: "text-amber-500" },
  { label: "Good", color: "bg-blue-500", textColor: "text-blue-500" },
  { label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-500" },
];

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const strength = getPasswordStrength(password);
  const meetsLength = password.length >= 8;
  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const pw = formData.get("password") as string;
    const cpw = formData.get("confirmPassword") as string;

    if (pw !== cpw) {
      setError("Passwords do not match");
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      setLoading(false);
      return;
    }

    const result = await resetPassword(formData);
    if (result && !result.success) {
      setError(result.error);
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">
          Set new password
        </h1>
        <p className="mt-2 text-sm text-on-surface-tertiary">
          Enter your new password below. Must be at least 8 characters.
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

        <div
          className={`space-y-1.5 transition-opacity duration-200 ${loading ? "pointer-events-none opacity-60" : ""}`}
        >
          <label
            htmlFor="password"
            className="block text-[13px] font-medium text-on-surface"
          >
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block h-10 w-full rounded-lg border border-input-border bg-input-bg px-3.5 pr-10 text-sm text-on-surface transition-all duration-150 placeholder:text-on-surface-quaternary hover:border-input-border-hover focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20"
              placeholder="Enter new password"
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

          {/* Password strength */}
          {password.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i < strength
                        ? strengthConfig[strength - 1].color
                        : "bg-border-default"
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {meetsLength ? (
                    <Check className="h-3.5 w-3.5 text-zinc-600" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-on-surface-quaternary" />
                  )}
                  <span
                    className={`text-[11px] ${meetsLength ? "text-zinc-600" : "text-on-surface-quaternary"}`}
                  >
                    At least 8 characters
                  </span>
                </div>
                {strength > 0 && (
                  <span
                    className={`text-[11px] font-medium ${strengthConfig[strength - 1].textColor}`}
                  >
                    {strengthConfig[strength - 1].label}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className={`space-y-1.5 transition-opacity duration-200 ${loading ? "pointer-events-none opacity-60" : ""}`}
        >
          <div className="flex items-center justify-between">
            <label
              htmlFor="confirmPassword"
              className="block text-[13px] font-medium text-on-surface"
            >
              Confirm password
            </label>
            {passwordsMatch && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-600">
                <Check className="h-3 w-3" />
                Match
              </span>
            )}
            {passwordsMismatch && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-red-500">
                <X className="h-3 w-3" />
                No match
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`block h-10 w-full rounded-lg border bg-input-bg px-3.5 pr-10 text-sm text-on-surface transition-all duration-150 placeholder:text-on-surface-quaternary hover:border-input-border-hover focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 ${
                passwordsMismatch
                  ? "border-red-300"
                  : passwordsMatch
                    ? "border-zinc-300"
                    : "border-input-border"
              }`}
              placeholder="Confirm new password"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-quaternary transition-colors hover:text-on-surface-secondary"
            >
              {showConfirm ? (
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
              Updating password...
            </>
          ) : (
            <>
              Update password
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
