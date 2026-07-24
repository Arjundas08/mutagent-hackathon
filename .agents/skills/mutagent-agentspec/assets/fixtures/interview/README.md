# Four-kind interview fixtures (Wave-2A exit check)

These fixtures prove **interview ORDERING** — something the Wave-1 example *cards* cannot show (a
finished card has no trace of the order its fields were captured in). Each fixture is a compact
phase-by-phase transcript of the intent-first FSM (`../../../references/workflows/orchestrator-protocol.md`,
phases I0 → I9) for one `kind`, annotated against the four Wave-2A exit checks:

1. **Preserve confirmed intent** — the approved card matches what the operator confirmed (resume/amend
   never loses it).
2. **Expose unknowns** — genuine unknowns land in `intent.unknowns[]`, never invented into requirements.
3. **Ask integration requirements** — context `access` / action `binding` questions are asked (with the
   CLOSED binding-kind enum, R3), never assumed.
4. **Never choose kind/target before the capability inventory** — `kind` is proposed at **I5 only after
   the I4b capability inventory** (incl. delegates); target is chosen **LAST** at I8.

One fixture per kind: `agent-interview.md`, `skill-interview.md`, `multiagent-interview.md`,
`workflow-interview.md`.
