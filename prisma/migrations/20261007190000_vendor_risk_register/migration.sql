-- AI vendor risk register (Prompt 7).
-- Vendors are GLOBAL reference data (no organization FK): a vendor's risk tier
-- describes the vendor's own data-handling posture, not any single org's.
-- Admins adjust tiers in Admin -> Vendors; changes apply platform-wide.
--
-- DEFAULT TIERS (documented Oct 2026; user-adjustable in the Admin UI):
-- - OpenAI (ChatGPT) .......... HIGH ..... Consumer chat product. Inputs on
--   consumer tiers may be used for training unless the user opts out; very
--   broad data-exposure surface for pasted content.
-- - Anthropic (Claude) ......... MODERATE . Commercial terms commit to NOT
--   training on customer inputs; still a third-party processor of whatever
--   the employee pastes.
-- - Google (Gemini) ............ HIGH ..... Consumer Gemini terms have
--   historically permitted human review / training use on consumer tiers;
--   Workspace data boundary is better but the product default skews open.
-- - Microsoft (Copilot) ........ MODERATE . M365 Copilot carries enterprise
--   data-boundary commitments; consumer Copilot is less constrained.
--   Middle tier reflects the split.
-- - Perplexity ................. HIGH ..... Search-augmented: queries are
--   routed to third-party search/index providers, widening exposure; younger
--   enterprise control posture than the hyperscalers.
-- These are starting judgments, not certifications. If a tier is wrong for
-- your org, change it in Admin -> Vendors — classification updates immediately.
--
-- Operations: hand-apply this SQL in the Supabase SQL editor, then
-- `npx prisma migrate resolve --applied 20261007190000_vendor_risk_register`
-- from the repo. NEVER run `prisma migrate deploy` in the Vercel build
-- (builds cannot reach Supabase; P1001).

-- CreateTable
CREATE TABLE "ai_vendors" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "website" TEXT,
    "risk_tier" "RiskLevel" NOT NULL,
    "data_handling_notes" TEXT,
    "tool_aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_vendors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_vendors_name_key" ON "ai_vendors"("name");

-- Seed: the 5 tools the Reliance Tracker extension detects. Idempotent.
INSERT INTO "ai_vendors" ("id", "name", "type", "website", "risk_tier", "data_handling_notes", "tool_aliases", "is_active", "updated_at")
VALUES
  ('af486754-9d2d-49bc-9d16-283711360f3f', 'OpenAI', 'LLM_PROVIDER', 'https://openai.com',
   'HIGH',
   'Consumer ChatGPT tiers may use inputs for training unless opted out. Treat pasted content as exposed to a third party by default.',
   ARRAY['CHATGPT', 'ChatGPT', 'chatgpt', 'GPT-4', 'GPT-4o', 'OpenAI'],
   true, now()),
  ('1cf48f9f-767f-405d-bfb5-1ef8e4546a92', 'Anthropic', 'LLM_PROVIDER', 'https://www.anthropic.com',
   'MODERATE',
   'Commercial terms commit to not training on customer inputs, but pasted content is still processed by a third party.',
   ARRAY['CLAUDE', 'Claude', 'claude', 'Anthropic'],
   true, now()),
  ('14af1ac5-6712-4161-b70b-64caec513316', 'Google', 'LLM_PROVIDER', 'https://gemini.google.com',
   'HIGH',
   'Consumer Gemini terms have permitted human review and training use on consumer tiers; Workspace boundary is stronger but the product default skews open.',
   ARRAY['GOOGLE_GEMINI', 'Gemini', 'gemini', 'Google Gemini', 'Bard'],
   true, now()),
  ('c79702be-0d33-4be8-9276-73f7ad5db528', 'Microsoft', 'LLM_PROVIDER', 'https://copilot.microsoft.com',
   'MODERATE',
   'M365 Copilot carries enterprise data-boundary commitments; consumer Copilot is less constrained. Tier reflects the split.',
   ARRAY['MICROSOFT_COPILOT', 'Copilot', 'copilot', 'Microsoft Copilot', 'M365 Copilot'],
   true, now()),
  ('f7866c76-75bb-4c5c-ae5d-4ffd9bb115e8', 'Perplexity', 'LLM_PROVIDER', 'https://www.perplexity.ai',
   'HIGH',
   'Search-augmented: queries are routed to third-party search/index providers, widening exposure; younger enterprise control posture.',
   ARRAY['PERPLEXITY', 'Perplexity', 'perplexity'],
   true, now())
ON CONFLICT ("name") DO NOTHING;
