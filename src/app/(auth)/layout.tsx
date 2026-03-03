import Image from "next/image";
import { SealCheck } from "@phosphor-icons/react/ssr";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Left panel — editorial branding */}
      <div className="relative hidden w-[480px] shrink-0 lg:flex lg:flex-col lg:justify-between bg-zinc-950 overflow-hidden">
        {/* Subtle gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-950/80 via-zinc-950 to-zinc-950" />
        <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-brand-900/20 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col justify-between p-10">
          {/* Logo */}
          <Image
            src="/logo-with-text.png"
            alt="Human In The Loop Governance"
            width={240}
            height={56}
            priority
          />

          {/* Hero text */}
          <div className="space-y-10">
            <div>
              <h2 className="text-[34px] font-bold leading-[1.1] tracking-tight text-white">
                Document every
                <br />
                AI decision.
              </h2>
              <p className="mt-5 max-w-[340px] text-[15px] leading-relaxed text-zinc-400">
                The compliance platform for teams using AI in regulated
                workflows. Track, review, and approve — all in one place.
              </p>
            </div>

            {/* Feature list */}
            <div className="space-y-4">
              {[
                "Real-time audit trail for every record",
                "Role-based review and approval workflow",
                "Immutable storage for compliance",
              ].map((text) => (
                <div key={text} className="flex items-start gap-3">
                  <SealCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                  <span className="text-[14px] text-zinc-300">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <p className="text-[12px] text-zinc-600">
            Trusted by compliance teams at regulated organizations
          </p>
        </div>
      </div>

      {/* Right panel — form area */}
      <div className="relative flex flex-1 flex-col bg-surface">
        {/* Mobile header */}
        <div className="relative lg:hidden border-b border-border-subtle">
          <div className="flex items-center px-6 py-4">
            <Image
              src="/logo-with-text.png"
              alt="Human In The Loop Governance"
              width={180}
              height={42}
              priority
            />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 text-center text-[11px] text-on-surface-quaternary">
          &copy; {new Date().getFullYear()} Human In The Loop. All rights
          reserved.
        </div>
      </div>
    </div>
  );
}
