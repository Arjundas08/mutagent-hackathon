# Interview fixture — kind: Workflow (incident-routing)

Emits the `workflow-incident-routing` card. `[✓n]` marks an exit check.

| Phase | Operator ↔ interview | Captured |
|---|---|---|
| **I0 Frame** | "Incident routing varies by operator and may omit evidence or required approval." | pain, desired change |
| **I1 Intent** | outcomes (one reviewable routing graph; escalate only with evidence + approval); SOP; nonGoals (diagnose/remediate); `unknowns: []` **[✓2]** | `intent` |
| **I2 Context** | incident-record via **saas**, service-ownership via **sdk** (closed R3 enum) **[✓3]** | `context[]` |
| **I3 Actions** | one action `page-on-call`, approval required before every page | `actions[]` |
| **I4 Seed eval** | criteria: `page-requires-approval`, `graph-resolves`; scenario `missing-ownership` | `evaluation` (draft) |
| **I4b Capability inventory** | code: none; skills: none; **delegates: none** — captured BEFORE kind **[✓4]** | `capabilities` (base) |
| **I5 Propose kind** | INFER `Workflow` — a reusable control-flow GRAPH with **no persona / no system prompt**; the value is the reviewable routing path itself, not an autonomous subject. Confirm. | `kind: Workflow` after I4b **[✓4]** |
| **I6 Derive design** | the canonical graph directly: `state` · `entry` · nodes with strict `{kind: action, ref: page-on-call}` executor + separate `contextRefs` on the retrieve node · bounded/branching edges · terminal states | `spec.workflow` |
| **I7 Close eval** | confirm + `incident-routing-cases` (Workflow item contract: `path` + node-by-node `nodeOutputs`) | `evaluation` (final) |
| **I8 Select target(s)** | temporal (framework/code) + a managed platform (platform-config) — LAST **[✓4]** | `targets[]` |
| **I9 Recap + emit** | recap; approve; `*validate-spec` PASS (entry/edges/executors resolve; no unbounded loop) | card |
