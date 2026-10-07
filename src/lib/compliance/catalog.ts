// Curated starter set: paraphrased review prompts, not full standards text or
// proof of compliance. Verify applicability against authoritative publications.
export const starterFrameworks = [
  { key: "NIST_AI_RMF", name: "NIST AI RMF — starter set", version: "1.0 (2023)", source: "https://airc.nist.gov/airmf-resources/airmf/", items: [
    ["GOVERN 1.1", "AI-use governance", "Document applicable policies and legal requirements for this AI use."],
    ["GOVERN 1.2", "Trustworthy AI considerations", "Consider trustworthy AI characteristics in organizational policies and decisions."],
    ["GOVERN 1.4", "Transparent risk process", "Document the risk management process and its outcomes."],
    ["GOVERN 2.1", "Accountable roles", "Identify accountable users and reviewers for AI reliance decisions."],
    ["MAP 1.1", "Use context", "Document intended purpose, context, stakeholders, and impacts of AI use."],
    ["MAP 1.5", "Risk tolerance", "Determine organizational risk tolerance for consequential AI use."],
    ["MAP 2.3", "Data and output validity", "Consider scientific integrity, validity, limitations, and data suitability for the use context; do not treat fluent output as verified evidence."],
    ["MAP 5.1", "Impact likelihood and magnitude", "Consider likelihood and magnitude of beneficial and harmful impacts on affected parties."],
    ["MEASURE 2.5", "Validity and reliability", "Evaluate validity and reliability of AI output before relying on it."],
    ["MEASURE 2.10", "Privacy risk", "Evaluate privacy risks arising from AI use and sensitive inputs."],
    ["MANAGE 1.1", "Proceed decision", "Determine whether AI use achieves its intended purpose and whether to proceed."],
    ["MANAGE 1.3", "High-priority risk response", "Develop responses for high-priority risks before consequential reliance."],
  ] },
  { key: "EU_AI_ACT", name: "EU AI Act — starter set", version: "Regulation (EU) 2024/1689", source: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", items: [
    ["Art. 50(1)", "Human interaction transparency", "Applicability check: providers of systems interacting directly with people must inform them they are interacting with AI unless obvious in context; role and exceptions matter."],
    ["Art. 50(4)", "Generated content disclosure", "Applicability check: deployers must disclose deepfakes and AI-generated/manipulated text published to inform the public on matters of public interest, subject to stated exceptions including human review/editorial responsibility for text. Not every client message or external report is in scope."],
    ["Art. 50(5)", "Clear timely disclosure", "Where Article 50 disclosures apply, provide clear and distinguishable information no later than first interaction/exposure; consider accessibility."],
  ] },
  { key: "ISO_42001", name: "ISO/IEC 42001 — starter set", version: "2023", source: "https://www.iso.org/standard/81230.html", items: [
    ["A.7.3", "Acquisition of data", "Review how data used with AI is acquired and document provenance/authorization as appropriate. Paraphrased Annex A control prompt; not normative standard text."],
    ["A.7.4", "Quality of data for AI systems", "Review data quality and fitness for the intended AI use. Paraphrased Annex A control prompt; assess applicability in the organization's management system."],
    ["A.7.5", "Data provenance", "Document provenance of relevant input data and evidence. Paraphrased Annex A control prompt; licensed standard remains authoritative."],
  ] },
] as const;
