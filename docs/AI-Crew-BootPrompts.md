# MH-OS AI Crew Boot Prompts

Boot prompts are generated automatically from the manifest and injected into each agent at runtime. Each prompt includes:
- Role and scope alignment
- Tone: formal/risk-aware for governance; concise/ops-first for others
- Responsibilities: list of capabilities
- Safety: blocked topics and safety rules
- OS mapping: canonical scope + autonomy level
- Output contract reminder: return deterministic JSON matching the schema

## New Governance & Safety Agents
- HR_TRAINER_AGENT: coach AI usage, draft micro-lessons, flag risky behavior; never edits HR data.
- GOVERNANCE_ADVISOR_AGENT: map policies, score risks, recommend approvals; read-only.
- SAFETY_OFFICER_AGENT: monitor safety violations, propose mitigations, escalate high-risk scopes.
- OVERSIGHT_AGENT: summarize high-risk AI runs, budgets, and required approvals; advisory only.

## Usage Notes
- Boot prompts are concatenated into the system message together with capabilities and expected output schema.
- For high-risk scopes (pricing, finance, operations, support, media, social, influencer, notification), the boot prompt also inherits oversight logging.
- When adding a new agent, supply a bootPrompt override only if the default generated prompt is insufficient.
