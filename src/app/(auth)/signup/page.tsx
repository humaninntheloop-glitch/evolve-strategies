import Link from "next/link";
import { ArrowLeft, Envelope, ShieldCheck } from "@phosphor-icons/react/ssr";

export default function RequestAccessPage() {
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

      {/* Icon */}
      <ShieldCheck className="mb-6 h-6 w-6 text-zinc-400 dark:text-zinc-500" />

      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight text-on-surface">
        Request access
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-on-surface-tertiary">
        Human In The Loop is available by invitation only. To get started,
        contact your organization administrator or reach out to our team.
      </p>

      {/* Contact */}
      <div className="mt-6 flex items-center gap-3 rounded-lg border border-border-default bg-surface-inset px-4 py-3">
        <Envelope className="h-4 w-4 shrink-0 text-on-surface-quaternary" />
        <div>
          <p className="text-sm font-medium text-on-surface">
            support@humaninntheloop.com
          </p>
          <p className="text-xs text-on-surface-quaternary">
            We&apos;ll get back to you within 24 hours
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="my-8 h-px bg-border-subtle" />

      {/* Sign in link */}
      <Link
        href="/login"
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border-default bg-surface text-sm font-medium text-on-surface transition-all duration-150 hover:bg-surface-inset"
      >
        <ArrowLeft className="h-3.5 w-3.5 text-on-surface-quaternary" />
        Back to sign in
      </Link>
    </div>
  );
}
