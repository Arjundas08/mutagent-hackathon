# Interview fixture — kind: Agent (support-triage)

Proves the intent-first ordering. Emits the `agent-support-triage` card. `[✓n]` marks an exit check.

| Phase | Operator ↔ interview | Captured |
|---|---|---|
| **I0 Frame** | "Operators waste time gathering evidence + classifying every support ticket." | domain, pain, desired change |
| **I1 Intent** | outcomes (cited rec in 60s; change state only after approval); long-form SOP **before** jobs; constraints; nonGoals (refunds/billing/contact); assumptions | `intent` — `unknowns: ["Confidence threshold for mandatory escalation"]` **[✓2]** genuine unknown recorded, not invented |
| **I2 Context** | "What info do you read, and how?" → ticket-record via **mcp**, account-record via **sdk** (both in the closed R3 enum) **[✓3]** integration asked, not assumed | `context[]` |
| **I3 Actions** | "Any outbound effects?" → one action `update-ticket`, approval required | `actions[]` |
| **I4 Seed eval** | criteria-first: `no-unapproved-write`, `grounded-route`; scenarios sketched | `evaluation` (draft) |
| **I4b Capability inventory** | "Local code? loadable skills? delegates?" → code: triage-confidence; skills: none; **delegates: none** **[✓4]** inventory captured BEFORE kind | `capabilities` (base) |
| **I5 Propose kind** | INFER `Agent` (one autonomous subject w/ persona + operative prompt; no delegates → not MultiAgent). PROPOSE with WHY; operator confirms. | `kind: Agent` — chosen AFTER I4b **[✓4]** |
| **I6 Derive design** | persona + sacred systemPrompt; webhook trigger; canonical inline workflow (approval-gated `apply` executor `{kind: action, ref: update-ticket}`) | `spec.agent` |
| **I7 Close eval** | confirm criteria + scenarios (mapped to `triage-ticket`) + `triage-golden` dataset (local categories, case dims, items) | `evaluation` (final) |
| **I8 Select target(s)** | compare fit → **two** targets: claude-code (harness/markdown) + mastra (framework/code, impl.*) — chosen LAST **[✓4]** | `targets[]` |
| **I9 Recap + emit** | plain-language recap (incl. the open escalation-threshold unknown); operator approves; emit + `agentspec.decisions.md`; `*validate-spec` PASS | card + sidecar |

**Resume/amend:** re-opening to change the confidence threshold shows a proposed delta only — the rest
of the confirmed intent is preserved verbatim **[✓1]**.
