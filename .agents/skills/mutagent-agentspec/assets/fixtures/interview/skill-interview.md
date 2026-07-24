# Interview fixture — kind: Skill (release-brief)

Emits the `skill-release-brief` card. `[✓n]` marks an exit check.

| Phase | Operator ↔ interview | Captured |
|---|---|---|
| **I0 Frame** | "Release context is scattered across commits, PRs, checks, issues." | pain, desired change |
| **I1 Intent** | outcomes (traceable brief; post only the exact approved brief); SOP before jobs; nonGoals (merge/tag/publish/deploy); `unknowns: []` **[✓2]** honestly empty, not padded | `intent` |
| **I2 Context** | host repository reads via **host-tool** binding (closed R3 enum) **[✓3]** | `context[]` |
| **I3 Actions** | one OPTIONAL action `post-release-brief` via host-tool, approval required | `actions[]` |
| **I4 Seed eval** | criteria: `traceable-claims`, `no-unapproved-post`; scenario `context-only-host` | `evaluation` (draft) |
| **I4b Capability inventory** | code: none; skills: none; **delegates: none** — captured BEFORE kind **[✓4]** | `capabilities` (base) |
| **I5 Propose kind** | INFER `Skill` (a reusable capability a HOST loads/invokes; no standalone activation, no delegates) — NOT an Agent-with-a-label. Confirm. | `kind: Skill` after I4b **[✓4]** |
| **I6 Derive design** | purpose · host-aware `invocation` · instructions · inputs/outputs · resources · `hostRequirements` · `failureBehavior` (degrade to manual-post) · `progressiveDisclosure` | `spec.skill` |
| **I7 Close eval** | confirm + `release-brief-cases` dataset (Skill item contract: `outputs`/`hostActions`, not Agent response) | `evaluation` (final) |
| **I8 Select target(s)** | codex + claude-code (both harness/markdown) — LAST **[✓4]** | `targets[]` |
| **I9 Recap + emit** | recap; approve; `*validate-spec` PASS (no decisionsRef — optional) | card |
