# ANTARYA — Dukan Ka Dimaag
### Team NIRVIKALP · HackIndia Spark-11 (CBIT Hyderabad) · Mutagent Challenge Track

An autonomous business agent for India's 13M+ kirana grocery stores. It reads live shop
state, decides what to do about it, asks the owner before spending money, and
learns from both its own forecast errors and the owner's disagreements.

---

## What the agent actually does

ANTARYA already had working AI modules — Gemini chat and vision OCR, Bhashini voice
billing, a two-stage hurdle ML forecaster. They worked, but they never thought
together. Nothing checked whether yesterday's forecast was right, or changed
tomorrow's behaviour because of it.

The **Autonomous Store Manager** (`server/services/storeManager.js`) is the layer
that closes that gap. One cycle:

| Stage | What happens |
|---|---|
| **Observe** | Inventory, 7-day velocity, dead stock, credit, weather + festival signals, and lessons from earlier cycles |
| **Understand** | Rank today's real business problems against active goals |
| **Evaluate** | Score past predictions against what actually sold |
| **Diagnose** | Root-cause each failure against a fixed taxonomy |
| **Optimize** | Propose parameter changes — persisted, never silently applied |
| **Execute** | Draft reorders / reminders / clearances, each with reasoning + a counterfactual |
| **Learn** | Turn errors and owner overrides into lessons for the next cycle |

Four goals drive it: `reduce_stockouts`, `increase_profit`, `recover_udhaar`,
`reduce_dead_inventory`. Every decision is tagged with the goal it serves.

**Every recommendation is explainable.** Not "Order 25 Milk" but:

> **Order 25 Milk** — 32 sold last 7 days · only 5 left (min 12) · monsoon raises milk demand ·
> Raksha Bandhan in 12 days (+20%) · **confidence 80%**
> *If you don't:* stockout in ~2 days, approx ₹850 of sales lost
> *If you do:* +₹2,600

**The owner is in the loop.** Nothing financially material fires automatically.
The owner approves, or rejects with a reason — and a rejection is treated exactly
like a wrong forecast: it becomes a lesson that shapes the next cycle.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite 5, Vanilla CSS, Lucide Icons |
| **Backend API** | Node.js + Express.js (Port 5001), Mongoose ODM v8 |
| **LLM (Brain 1)** | Google Gemini 2.5 Flash (`@google/genai` SDK) |
| **Voice (Brain 2)** | MeitY Bhashini ASR + TTS (Dhruva Pipeline) |
| **ML (Brain 3)** | Python FastAPI, CatBoost + LightGBM Two-Stage Hurdle Model |
| **Database** | MongoDB Atlas (with `mongodb-memory-server` offline fallback) |
| **Mutagent** | CLI v0.1.251, Helix Conductor, AgentSpec v0.3.0 |

---

## How Mutagent ADL was used — every stage executed

### ① SPEC — Agent specification
- **Tool:** `*validate-spec` (`npx tsx scripts/validate/validate-spec.ts`)
- **Result:** `[validate-spec] PASS — agentspec.mutagent.io/v0.3.0`
- **File:** [`agentspec.yaml`](agentspec.yaml) — defines the agent's intent, context sources, actions, evaluation criteria, and target

### ② BUILD — Implementation
- The Autonomous Store Manager, Gemini chat, Bhashini voice POS, and Hurdle ML service were hand-built in this Claude Code session
- The spec was synced against the implementation (not the other way around) — the transcripts show this plainly

### ③ EVALUATE — Real HTTP evaluation across 4 cycles
- **Tool:** `node run_real_eval.js` — sends 20 real HTTP POST requests to `POST /api/ai/chat` with a verified JWT
- **Pass criteria:** Response contains ≥1 expected keyword, is >30 characters, and carries no error payload
- **Final result:** **80.0% pass rate (16/20)** with live Gemini 2.5 Flash

### ④ DIAGNOSE — Root cause analysis
Failures were root-caused against a fixed taxonomy:
- `missing_fixture_product` — test expects a product term not in the seeded 7-product fixture
- `fallback_branch_ordering` — a keyword matched the wrong fallback branch before the intended one
- `fixture_persistence_bug` — POST endpoint silently dropped fields, breaking downstream queries
- `keyword_mismatch` — deterministic fallback doesn't cover the expected phrasing

### ⑤ OPTIMIZE — Applied fixes, re-evaluated
Each cycle applied targeted fixes based on the diagnosis, then re-ran the full eval suite:

| Cycle | Pass Rate | What changed before this run |
|---|---|---|
| **1 — Baseline** | **45%** (9/20) | Nothing. Starting point. |
| **2** | **50%** (10/20) | Seeded the eval fixture (the shop was *empty*). Added offline fallback branches. |
| **3** | **75%** (15/20) | Fixed fixture persistence bug. Fixed fallback branch ordering. Added customer/voice branches. |
| **4** | **80%** (16/20) | Validated agentspec against v0.3.0 schema. Gemini quota recovered — TC-01 now passes via live AI. |

Category movement, Cycle 1 → 4:

| Category | C1 | C4 |
|---|---|---|
| Customer & Credit | 0/3 | **3/3** |
| OCR & Vision | 1/3 | **3/3** |
| Resilience & Offline | 0/2 | **2/2** |
| Forecasting & ML | 1/4 | **3/4** |
| Voice Understanding | 4/4 | 3/4 |
| Inventory Intelligence | 3/4 | 2/4 |

### Four failures we did not fix

`TC-04`, `TC-06`, `TC-08`, `TC-16` still fail. They expect product terms
(*doodh, cheeni, lux soap, baarish chai, monthly ration*) absent from the seeded
7-product fixture, or phrasing the deterministic fallback doesn't cover.

We could have passed all four by adding keyword-specific branches. We didn't —
that optimises the scorecard, not the product. **80% with four honest failures is
the real number.**

---

## Custom Extension: `*retail-health`

We built a custom Mutagent evaluator skill that audits kirana store health:
- **Path:** [`extensions/retail-health/SKILL.md`](extensions/retail-health/SKILL.md)
- **What it does:** Scores a store on capital efficiency, credit risk, dead stock ratio, and operational health
- **Why:** Extends the Mutagent base system with a domain-specific evaluation stage

---

## Product Feedback (3 items filed via CLI)

All filed through `mutagent feedback send "..." --category <cat> --json`:

1. **`mutagent install helix` fails on Windows Git Bash** — GNU tar reads `C:\` as a remote host spec (ID: `dbefcdfd-...`)
2. **Zero-provider state is silent until a stage needs one** — nothing flags missing providers at install time (ID: `24a9085c-...`)
3. **Document which stages need a provider key** — couldn't determine up front whether `*evaluate`/`*diagnose` would run with 0 providers (ID: `d20a5e41-...`)

---

## Folder contents

| Path | What it is |
|---|---|
| `agentspec.yaml` | Agent specification — validated against `agentspec.mutagent.io/v0.3.0` |
| `eval_suite.json` | 20 evaluation cases across 6 categories |
| `evaluation/scorecard_cycle{1,2,3,4}.json` | Real scorecards, one per cycle |
| `evaluation/metrics.json` | ADL progression with honest limitations |
| `scorecard.json` | Latest cycle (cycle 4) |
| `traces/` | 80 per-test-case traces (20 cases × 4 cycles) |
| `transcripts/` | Claude Code session JSONL — main session + subagents |
| `feedback.md` | Product feedback, also filed via `mutagent-cli feedback send` |
| `architecture.md` | System architecture with Mermaid diagrams |
| `extensions/retail-health/` | Custom Mutagent skill |

## Reproducing the evaluation

```bash
npm run install:all
node seed_eval_db.js
cd server && node index.js
```

```bash
node run_real_eval.js
```

Requires `MONGO_URI`, `GEMINI_API_KEY` and `JWT_SECRET` in `server/.env`. Without
`MONGO_URI` the server starts an in-memory MongoDB automatically.
