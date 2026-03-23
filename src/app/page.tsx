import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle,
  ClipboardCheck,
  BarChart3,
  FileCheck,
} from "lucide-react";

/* ─── Live Authorization Feed Data ─── */
const feedEntries = [
  { title: "Legal Contract Drafting", status: "AUTHORIZED" as const, reviewer: "J. Chen", time: "14:32 UTC" },
  { title: "Marketing Copy Generation", status: "NOT AUTHORIZED" as const, reviewer: "S. Patel", time: "14:28 UTC" },
  { title: "Financial Report Summary", status: "AUTHORIZED" as const, reviewer: "M. Torres", time: "14:15 UTC" },
  { title: "Customer Email Response", status: "AUTHORIZED" as const, reviewer: "A. Kim", time: "13:58 UTC" },
  { title: "Policy Document Review", status: "PENDING" as const, reviewer: "—", time: "13:45 UTC" },
  { title: "Technical Documentation", status: "AUTHORIZED" as const, reviewer: "R. Singh", time: "13:32 UTC" },
  { title: "Compliance Brief Drafting", status: "NOT AUTHORIZED" as const, reviewer: "L. Wang", time: "13:20 UTC" },
  { title: "Product Description Copy", status: "AUTHORIZED" as const, reviewer: "D. Okafor", time: "13:08 UTC" },
  { title: "Internal Memo Drafting", status: "AUTHORIZED" as const, reviewer: "K. Müller", time: "12:55 UTC" },
  { title: "Risk Assessment Summary", status: "PENDING" as const, reviewer: "—", time: "12:42 UTC" },
];

const statusColor = {
  AUTHORIZED: "text-emerald-400",
  "NOT AUTHORIZED": "text-red-400",
  PENDING: "text-yellow-400",
};

/* ─── Authorization Record Fields ─── */
const recordFields = [
  { label: "Request ID", value: "APS-2024-00847" },
  { label: "Task", value: "Legal Contract Review — Vendor Agreement" },
  { label: "Requester", value: "M. Rodriguez, Legal Dept." },
  { label: "AI Model Used", value: "GPT-4o (Enterprise)" },
  { label: "Risk Level", value: "High — Regulatory Compliance" },
  { label: "Reviewer", value: "J. Chen, Senior Counsel" },
  { label: "Oversight Plan", value: "Full Legal Review Protocol" },
  { label: "Status", value: "AUTHORIZED FOR AI RELIANCE", isStatus: true },
  { label: "Decision Date", value: "2024-12-18 14:32 UTC" },
];

/* ─── Timeline Steps ─── */
const steps = [
  {
    title: "AI Reliance Details",
    desc: "The user defines the context and the specific AI output being used.",
  },
  {
    title: "AI Use Justification",
    desc: "The user must provide a clear business case for why they need to rely on the AI output for a specific task.",
  },
  {
    title: "Human Oversight Plan",
    desc: "The system automatically routes the request to the appropriate human reviewer or review group based on policy and content type.",
  },
  {
    title: "Risk Classification",
    desc: "The system captures the defined risk level of the reliance event, based on the Risk Classification and associated Risk Explanation.",
  },
  {
    title: "Authorization Decision",
    desc: "The human reviewer must explicitly authorize the use of the output (leading to Authorized for AI Reliance) or formally prohibit its use (leading to AI Reliance Not Authorized).",
  },
  {
    title: "AI Permission Slip",
    desc: "The system logs the full governance chain, creating an immutable Authorization Record of the decision.",
  },
];

/* ─── Benefit Cards ─── */
const benefits = [
  {
    icon: CheckCircle,
    title: "Clear Authorization Decisions",
    desc: "Ensures every reliance event is formally documented as Authorized for AI Reliance or AI Reliance Not Authorized.",
  },
  {
    icon: ClipboardCheck,
    title: "Documented Oversight",
    desc: "Enforces a mandatory Human Oversight Plan for all high-risk AI uses.",
  },
  {
    icon: BarChart3,
    title: "Risk Visibility",
    desc: "Provides auditable data on which AI Reliance events carry high Risk Classification.",
  },
  {
    icon: FileCheck,
    title: "Audit-Ready Records",
    desc: "Creates an immutable Authorization Record that satisfies regulatory requirements for human accountability.",
  },
];

export default function LandingPage() {
  return (
    <div className="dark">
      <div className="min-h-screen bg-surface text-on-surface">
        {/* ─── NAV ─── */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-default bg-surface/80 backdrop-blur-md transition-all duration-300">
          <div className="container mx-auto flex items-center justify-between px-6 py-4 lg:px-12">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo-with-text.png"
                alt="Human In The Loop"
                width={180}
                height={36}
                className="h-8 w-auto brightness-0 invert"
              />
            </Link>
            <div className="hidden items-center gap-8 md:flex">
              <a href="#solution" className="font-mono-display text-xs uppercase tracking-widest text-on-surface-tertiary transition-colors hover:text-on-surface">
                Solution
              </a>
              <a href="#how-it-works" className="font-mono-display text-xs uppercase tracking-widest text-on-surface-tertiary transition-colors hover:text-on-surface">
                How It Works
              </a>
              <a href="#benefits" className="font-mono-display text-xs uppercase tracking-widest text-on-surface-tertiary transition-colors hover:text-on-surface">
                Benefits
              </a>
              <a href="#contact" className="font-mono-display text-xs uppercase tracking-widest text-on-surface-tertiary transition-colors hover:text-on-surface">
                Contact
              </a>
            </div>
            <Link
              href="/login"
              className="hidden sm:inline-flex font-mono-display text-xs uppercase tracking-widest bg-white text-zinc-900 px-5 py-2.5 transition-colors hover:bg-white/90"
            >
              Create AI Permission Slip
            </Link>
          </div>
        </nav>

        {/* ─── HERO ─── */}
        <section className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left — Copy */}
              <div>
                <p className="font-mono-display text-xs uppercase tracking-[0.3em] text-brand-400 mb-6">
                  The System for Authorization Before AI Reliance
                </p>
                <h1 className="text-clamp-hero font-mono-display uppercase font-bold tracking-tight text-on-surface mb-8">
                  The Mandatory Control Point for AI Reliance.
                </h1>
                <p className="text-lg leading-relaxed text-on-surface-secondary max-w-xl mb-10">
                  Require explicit human Authorization before any AI-generated output is relied upon in a business context. Establish the human control point to manage risk and enforce policy compliance.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/login"
                    className="font-mono-display text-sm uppercase tracking-widest bg-white text-zinc-900 px-8 py-3.5 transition-colors hover:bg-white/90 signal-glow"
                  >
                    Create AI Permission Slip
                  </Link>
                  <a
                    href="#how-it-works"
                    className="font-mono-display text-sm uppercase tracking-widest border border-border-default text-on-surface px-8 py-3.5 transition-colors hover:bg-white/[0.04]"
                  >
                    View Workflow
                  </a>
                </div>
              </div>

              {/* Right — Live Feed */}
              <div className="etched-border p-1 hidden lg:block">
                <div className="border-b border-border-default px-4 py-3 flex items-center justify-between">
                  <span className="font-mono-display text-xs uppercase tracking-widest text-on-surface-tertiary">
                    Live Authorization Feed
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="h-[380px] overflow-hidden">
                  <div className="landing-feed-scroll">
                    {[...feedEntries, ...feedEntries].map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-4 py-3 border-b border-border-subtle hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-mono-display text-sm text-on-surface">
                            {entry.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 ml-4 shrink-0">
                          <span className={`font-mono-display text-xs font-semibold ${statusColor[entry.status]}`}>
                            {entry.status}
                          </span>
                          <span className="font-mono-display text-xs text-on-surface-tertiary">
                            {entry.reviewer}
                          </span>
                          <span className="font-mono-display text-xs text-on-surface-quaternary">
                            {entry.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── PROBLEM ─── */}
        <section id="problem" className="py-32 border-t border-border-default">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-3xl">
              <p className="font-mono-display text-xs uppercase tracking-[0.3em] text-brand-400 mb-6">
                The Problem
              </p>
              <h2 className="text-clamp-section font-mono-display uppercase font-bold tracking-tight text-on-surface mb-10">
                Unmanaged AI Reliance Risk
              </h2>
              <div className="space-y-6 text-on-surface-secondary text-lg leading-relaxed">
                <p>
                  The rapid adoption of generative AI has created a critical gap in enterprise governance. AI outputs are increasingly being used in critical decisions, legal drafting, and public-facing content without{" "}
                  <span className="text-on-surface font-medium">AI Authorization</span>.
                </p>
                <p>
                  Without a defined control point, your organization lacks a formal, structured mechanism for{" "}
                  <span className="text-on-surface font-medium">Human Oversight</span>. This blind{" "}
                  <span className="text-on-surface font-medium">AI Reliance</span> is an unmanaged operational risk, exposing the business to regulatory liability and reputational damage.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SOLUTION ─── */}
        <section id="solution" className="py-32 border-t border-border-default">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              {/* Left — Copy */}
              <div>
                <p className="font-mono-display text-xs uppercase tracking-[0.3em] text-brand-400 mb-6">
                  The Solution
                </p>
                <h2 className="text-clamp-section font-mono-display uppercase font-bold tracking-tight text-on-surface mb-10">
                  Authorization, Not Assumption
                </h2>
                <div className="space-y-6 text-on-surface-secondary text-lg leading-relaxed">
                  <p>
                    AI Permission Slip is the system that establishes mandatory{" "}
                    <span className="text-on-surface font-medium">AI Authorization</span> for every instance of{" "}
                    <span className="text-on-surface font-medium">AI Reliance</span>.
                  </p>
                  <p>
                    It acts as the essential governance gate, ensuring that the use of any AI output is justified, subjected to a defined{" "}
                    <span className="text-on-surface font-medium">Human Oversight Plan</span>, classified for risk, and formally decided upon by a responsible party. The system ensures that tacit reliance is converted into an auditable, explicit decision.
                  </p>
                </div>
              </div>

              {/* Right — Authorization Record Card */}
              <div className="etched-border">
                <div className="border-b border-border-default px-6 py-4">
                  <span className="font-mono-display text-xs uppercase tracking-[0.3em] text-on-surface-tertiary">
                    AI Permission Slip — Authorization Record
                  </span>
                </div>
                <div className="divide-y divide-border-subtle">
                  {recordFields.map((field) => (
                    <div key={field.label} className="flex items-start gap-4 px-6 py-3.5 transition-colors cursor-default">
                      <span className="font-mono-display text-xs uppercase tracking-widest text-on-surface-tertiary w-32 shrink-0 pt-0.5">
                        {field.label}
                      </span>
                      <span className={`font-mono-display text-sm ${field.isStatus ? "text-emerald-400 font-semibold" : "text-on-surface"}`}>
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section id="how-it-works" className="py-32 border-t border-border-default">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center mb-20">
              <p className="font-mono-display text-xs uppercase tracking-[0.3em] text-brand-400 mb-6">
                How It Works
              </p>
              <h2 className="text-clamp-section font-mono-display uppercase font-bold tracking-tight text-on-surface max-w-3xl mx-auto">
                The AI Authorization Workflow
              </h2>
              <p className="mt-6 text-on-surface-secondary text-lg max-w-2xl mx-auto">
                The system enforces a mandatory chain of human oversight before AI output can be acted upon.
              </p>
            </div>

            <div className="relative max-w-2xl mx-auto">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border-default" />

              <div className="space-y-0">
                {steps.map((step, i) => (
                  <div key={step.title} className="relative pl-16 pb-14 last:pb-0">
                    {/* Square step marker */}
                    <div className="absolute left-4 top-1 w-5 h-5 border-2 border-brand-400 bg-brand-400/20" />
                    <div className="font-mono-display text-xs uppercase tracking-[0.3em] text-brand-400 mb-2">
                      Step {i + 1}
                    </div>
                    <h3 className="font-mono-display text-xl font-bold text-on-surface uppercase tracking-tight mb-3">
                      {step.title}
                    </h3>
                    <p className="text-on-surface-secondary leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── BENEFITS ─── */}
        <section id="benefits" className="py-32 border-t border-border-default">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="mb-16">
              <p className="font-mono-display text-xs uppercase tracking-[0.3em] text-brand-400 mb-6">
                What You Get
              </p>
              <h2 className="text-clamp-section font-mono-display uppercase font-bold tracking-tight text-on-surface max-w-3xl">
                Verifiable Human Oversight
              </h2>
              <p className="mt-6 text-on-surface-secondary text-lg max-w-2xl">
                The AI Permission Slip system delivers the necessary proof of control for enterprise AI deployment.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-px bg-border-default">
              {benefits.map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.title}
                    className="bg-surface p-8 lg:p-12 group hover:bg-white/[0.02] transition-colors"
                  >
                    <Icon className="w-6 h-6 text-brand-400 mb-6" strokeWidth={1.5} />
                    <h3 className="font-mono-display text-lg font-bold uppercase tracking-tight text-on-surface mb-4">
                      {b.title}
                    </h3>
                    <p className="text-on-surface-secondary leading-relaxed">
                      {b.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── DIFFERENTIATION ─── */}
        <section className="py-32 border-t border-border-default">
          <div className="container mx-auto px-6 lg:px-12">
            <div>
              <p className="font-mono-display text-xs uppercase tracking-[0.3em] text-brand-400 mb-6">
                Differentiation
              </p>
              <h2 className="text-clamp-section font-mono-display uppercase font-bold tracking-tight text-on-surface mb-6">
                Active Authorization, Not Passive Tracking
              </h2>
              <p className="text-lg text-on-surface-secondary mb-16 max-w-2xl">
                AI Permission Slip is not a passive tool. It is an active enforcement system governing the AI Reliance event.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-px bg-border-default etched-border overflow-hidden">
              {/* We Are NOT */}
              <div className="bg-surface p-8 lg:p-12 opacity-40">
                <p className="font-mono-display text-xs uppercase tracking-[0.3em] text-on-surface-tertiary mb-8">
                  We Are NOT
                </p>
                <div className="space-y-8">
                  <div>
                    <h3 className="font-mono-display text-sm font-bold uppercase text-on-surface-tertiary mb-2">
                      Monitoring
                    </h3>
                    <p className="text-on-surface-tertiary text-sm leading-relaxed">
                      Passively tracks how users interact with AI tools. Records activity after the fact. No enforcement.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-mono-display text-sm font-bold uppercase text-on-surface-tertiary mb-2">
                      Logging
                    </h3>
                    <p className="text-on-surface-tertiary text-sm leading-relaxed">
                      Records the inputs and outputs of AI models. No governance decision. No accountability.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-mono-display text-sm font-bold uppercase text-on-surface-tertiary mb-2">
                      Passive Tracking
                    </h3>
                    <p className="text-on-surface-tertiary text-sm leading-relaxed">
                      These systems record user activity after the fact. No control point. No human action required.
                    </p>
                  </div>
                </div>
              </div>

              {/* We ARE */}
              <div className="bg-surface p-8 lg:p-12 border-l border-brand-400/30">
                <p className="font-mono-display text-xs uppercase tracking-[0.3em] text-brand-400 mb-8">
                  We ARE
                </p>
                <div className="space-y-8">
                  <div>
                    <h3 className="font-mono-display text-sm font-bold uppercase text-on-surface mb-2">
                      Active Authorization
                    </h3>
                    <p className="text-on-surface-secondary text-sm leading-relaxed">
                      We <span className="text-on-surface font-medium">block use until human action is taken</span>.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-mono-display text-sm font-bold uppercase text-on-surface mb-2">
                      Human-in-the-Loop Governance
                    </h3>
                    <p className="text-on-surface-secondary text-sm leading-relaxed">
                      We enforce the formal <span className="text-on-surface font-medium">Human Oversight</span> step.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-mono-display text-sm font-bold uppercase text-on-surface mb-2">
                      Decision Enforcement
                    </h3>
                    <p className="text-on-surface-secondary text-sm leading-relaxed">
                      We record the auditable human decision and the <span className="text-on-surface font-medium">Authorization status</span>, ensuring accountability.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CONTACT CTA ─── */}
        <section id="contact" className="py-32 border-t border-border-default">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-clamp-section font-mono-display uppercase font-bold tracking-tight text-on-surface mb-8">
                Establish the Human Control Point in Your AI Strategy
              </h2>
              <Link
                href="/login"
                className="inline-flex font-mono-display text-sm uppercase tracking-widest bg-white text-zinc-900 px-10 py-4 transition-colors hover:bg-white/90 signal-glow"
              >
                Create AI Permission Slip
              </Link>
              <p className="mt-6 text-on-surface-secondary text-sm">
                Deploy AI with confidence, backed by verifiable governance and auditable Human Oversight.
              </p>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="border-t border-border-default py-12">
          <div className="container mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <Image
              src="/logo-with-text.png"
              alt="Human In The Loop"
              width={140}
              height={28}
              className="h-6 w-auto brightness-0 invert opacity-60"
            />
            <p className="font-mono-display text-xs text-on-surface-tertiary tracking-widest">
              &copy; {new Date().getFullYear()} Human In The Loop Governance. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
