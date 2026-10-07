import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Reliance Tracker",
  description: "Privacy policy for the Reliance Tracker Chrome extension for Human In The Loop.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-surface-overlay px-4 py-12 font-sans text-on-surface sm:px-6 sm:py-16">
      <article className="mx-auto max-w-[760px] rounded-2xl border border-border-default bg-surface p-6 shadow-sm sm:p-10">
        <header className="mb-8 border-b border-border-subtle pb-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Privacy Policy — Reliance Tracker</h1>
          <p className="mt-3 text-on-surface-secondary">Chrome extension for Human In The Loop</p>
          <p className="mt-2 text-sm text-on-surface-tertiary">Last updated: <time dateTime="2026-10-06">October 6, 2026</time>.</p>
        </header>
        <div className="space-y-8 text-base leading-7 text-on-surface-secondary [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-on-surface [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          <p>Reliance Tracker helps you document how you use AI tools by capturing prompt-and-response pairs from AI chat sites and filing them as reliance events to your own Human In The Loop platform.</p>
          <section aria-labelledby="local-data">
            <h2 id="local-data">1. Data the extension stores locally</h2>
            <p>When you use the extension on a supported AI site (ChatGPT, Claude, Gemini, Microsoft Copilot, Perplexity), it can capture the text of prompts and AI responses you choose to keep. This data is stored only in your browser (Chrome local storage) as a private queue. It is never transmitted anywhere unless you take explicit action (see §2). The extension also stores locally the settings you enter: your Human In The Loop platform URL and your API key.</p>
          </section>
          <section aria-labelledby="sent-data">
            <h2 id="sent-data">2. Data you choose to send</h2>
            <p>Captured data leaves your browser only when you click &quot;File reliance event&quot; for a specific capture. At that moment the extension sends the reliance details to the platform URL you configured, authenticated with your API key over HTTPS. Filed records are then governed by your Human In The Loop platform&apos;s own data policies.</p>
          </section>
          <section aria-labelledby="not-collected">
            <h2 id="not-collected">3. Data we do not collect</h2>
            <ul>
              <li>No analytics, telemetry, or usage tracking of any kind.</li>
              <li>No advertising identifiers or cross-site tracking.</li>
              <li>Your captures, API key, and settings are never sent to the extension developer or any third party — only to the platform URL you configure.</li>
            </ul>
          </section>
          <section aria-labelledby="third-parties">
            <h2 id="third-parties">4. Third-party services</h2>
            <p>The extension&apos;s interface loads the Outfit typeface from Google Fonts. When fonts load, Google necessarily receives standard technical information (such as your IP address and user agent), subject to <a className="underline underline-offset-4 hover:text-on-surface" href="https://policies.google.com/privacy">Google&apos;s Privacy Policy</a>. No extension data is sent to Google.</p>
          </section>
          <section aria-labelledby="retention">
            <h2 id="retention">5. Data retention and your controls</h2>
            <ul>
              <li>Queue: captures stay in your browser until you file them, discard them individually, or clear the queue.</li>
              <li>API key: you can remove it at any time on the extension&apos;s Settings page, or revoke it from your platform&apos;s Admin → API Keys page (revocation immediately disables the key).</li>
              <li>Filed records: managed inside your Human In The Loop platform, including its review and retention workflows.</li>
            </ul>
          </section>
          <section aria-labelledby="security">
            <h2 id="security">6. Security</h2>
            <p>Your API key is stored in Chrome&apos;s local extension storage (not synced, not readable by websites) and is transmitted only over HTTPS as a Bearer token to your configured platform. API keys are stored on the platform as SHA-256 hashes — the plaintext key is shown once at creation and never stored.</p>
          </section>
          <section aria-labelledby="children">
            <h2 id="children">7. Children&apos;s privacy</h2>
            <p>Reliance Tracker is a workplace governance tool and is not directed at children under 13. We do not knowingly collect data from children.</p>
          </section>
          <section aria-labelledby="changes">
            <h2 id="changes">8. Changes to this policy</h2>
            <p>If this policy changes materially, the updated version will be posted here with a revised &quot;Last updated&quot; date.</p>
          </section>
          <section aria-labelledby="contact">
            <h2 id="contact">9. Contact</h2>
            <p>Questions about this policy: <a className="break-words underline underline-offset-4 hover:text-on-surface" href="mailto:humaninntheloop@gmail.com">humaninntheloop@gmail.com</a></p>
          </section>
        </div>
      </article>
    </main>
  );
}
