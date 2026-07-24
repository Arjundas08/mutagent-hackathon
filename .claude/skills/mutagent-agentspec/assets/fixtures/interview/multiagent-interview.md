# Interview fixture — kind: MultiAgent (controlled-release)

Emits the `multiagent-controlled-release` card. `[✓n]` marks an exit check. This is the fixture where
the capability inventory (esp. **delegates**) is decisive for the kind — proving why I4b precedes I5.

| Phase | Operator ↔ interview | Captured |
|---|---|---|
| **I0 Frame** | "One release agent would combine evidence gathering, judgment, and high-impact write authority." | separation-of-duties need |
| **I1 Intent** | outcomes (separate duties; publish only verified + authorized); SOP; nonGoals; `unknowns: ["Maximum nested resource-card depth"]` **[✓2]** | `intent` |
| **I2 Context** | release-evidence via **cli** binding (closed R3 enum) **[✓3]** | `context[]` |
| **I3 Actions** | one action `publish-release` (only the publisher may write) | `actions[]` |
| **I4 Seed eval** | criteria: `single-action-holder`, `watchdog-no-dispatch`; scenario `failed-check-stops` | `evaluation` (draft) |
| **I4b Capability inventory** | code: none; skills: none; **delegates: [release-researcher, risk-assessor, release-publisher]** — three delegated roles surfaced BEFORE kind **[✓4]** | `capabilities` (base) |
| **I5 Propose kind** | INFER `MultiAgent` **because** the I4b inventory shows separated delegated duties + a governance/observation boundary. *Had delegates been asked after kind, a single-Agent guess could have wrongly justified itself* — this is exactly the circular-confirmation the ordering prevents. Confirm. | `kind: MultiAgent` after I4b **[✓4]** |
| **I6 Derive design** | orchestrator `release-coordinator`; 5 embedded member cards (intentRef/contextRefs/actionRefs into the parent); `relations{subagents, observes}` (dispatch vs watch, distinct); canonical workflow with one BOUNDED retry loop; member `{kind: member, ref: …}` executors | `spec.multiAgent` |
| **I7 Close eval** | confirm + `controlled-release-cases` (MultiAgent item contract: memberOutputs + workflowNodeOutputs) | `evaluation` (final) |
| **I8 Select target(s)** | langgraph (framework/code) + a neutral custom platform (`acme-release-runtime`, platform-config) — LAST **[✓4]** | `targets[]` |
| **I9 Recap + emit** | recap (incl. the nesting-depth unknown); approve; `*validate-spec` PASS (member graph acyclic, N02) | card |
