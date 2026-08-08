# Product Feedback to the Mutagent Team
### Team NIRVIKALP · HackIndia Spark-11

All three items below were filed through the CLI with
`mutagent feedback send "..." --category <cat> --json` as we hit them, not written
up afterwards. Feedback IDs returned by the platform are included.

---

### 1. `mutagent install helix` fails on Windows under Git Bash
**Category:** `cli` · **ID:** `dbefcdfd-dc7d-464f-ad37-e3af5db7a1e4`

Running the documented install command from Git Bash on Windows 11 fails:

```
Error: Extracting the helix plugin failed (tar exit 2).
tar (child): Cannot connect to C: resolve failed
gzip: stdin: unexpected end of file
```

GNU tar reads the `C:\...` destination as a **remote host spec** (`host:path`), so it
tries to open a network connection instead of a local file. The CLI's suggestion
("the archive may be corrupt — retry") points at the wrong cause, so retrying never
helps.

**Workaround we found:** run the identical command from PowerShell, where Windows'
native bsdtar is used. It then succeeds cleanly (7/7 skills).

**Suggested fix:** detect a Windows drive-letter destination and pass `--force-local`
to tar, or prefer the system tar on `win32`. Failing that, make the error message
name the real cause — this cost us time early in a 36-hour window.

---

### 2. Zero-provider state is silent until a stage needs one
**Category:** `helix` · **ID:** `24a9085c-92d9-484b-a1ad-a6762499e5d3`

`mutagent install helix` succeeds and Helix boots normally with **0 BYOK providers
configured**. Nothing at install time flags it. `mutagent auth status` reports
`authenticated: true` and `onboarding: true`, which reads like a completed setup.

A first-time user only discovers the gap when a lifecycle stage actually needs a
provider — which, under hackathon time pressure, is the worst moment to find out.

**Suggested fix:** print a readiness line after install (`providers: 0 — run
'mutagent providers add'`) and surface the provider count in the Helix dashboard's
SETUP row next to the onboarding status.

---

### 3. Document which stages need a provider key and which don't
**Category:** `stage:evaluate` · **ID:** `d20a5e41-744c-4787-9946-29019c9f6b1f`

The hackathon README describes two eval substrates — a host-runtime judge needing no
provider key, and an exported code eval suite. The `mutagent-evaluator` skill says it
"reasons on the HOST runtime — NO external provider key", but `*optimize` dispatches
an engineer that writes code, and it isn't stated whether that path needs one.

We could not determine up front whether `*evaluate` / `*diagnose` / `*optimize` would
run with `providers: 0`. That makes committing to a bounded improvement loop risky
when you can't afford to discover a hard dependency at stage four.

**Suggested fix:** a small capability matrix in the docs — stage × requires-provider
× fallback-behaviour. Even a single line per stage in `*status` output would resolve it.

---

## What worked well

- The **judge-never-fix** invariant is the right call. Keeping evaluation honest by
  construction — rather than letting the scorer quietly patch what it scores — is
  exactly the discipline that caught the fabricated scorecards in our own repo.
- **Approval-gated applies** matched what we independently concluded the product
  needed: we built the same gate into the Store Manager's runtime before reading that
  Helix works the same way. Convergent design is a good sign.
- `--json` on every command made the CLI genuinely scriptable from a coding agent.
