import Link from "next/link";
import { FileMagnifyingGlass } from "@phosphor-icons/react/ssr";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-inset">
      <div className="text-center animate-fade-in-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated border border-border-default">
          <FileMagnifyingGlass className="h-8 w-8 text-on-surface-quaternary" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-on-surface">Page not found</h1>
        <p className="mt-2 text-sm text-on-surface-secondary">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-9 items-center rounded-lg bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
