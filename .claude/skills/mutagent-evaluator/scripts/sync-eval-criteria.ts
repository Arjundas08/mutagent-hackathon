/**
 * scripts/sync-eval-criteria.ts — the EVAL-LEG reconcile CONTRACT (Wave-2 W2I5 · KP-003).
 * ---------------------------------------------------------------------------
 * The THIRD leg of the def → impl → eval triad. Today `#sync-spec` reconciles two
 * legs — spec ↔ impl. When an implementation amends (the ⑤ OPTIMIZE loop's ai-engineer,
 * or a brownfield drift), the eval criteria that GROUND the subject's evaluation can go
 * stale w.r.t. the changed impl. This module is the EVALUATOR-SIDE CONTRACT that the
 * reconcile (ai-architect REASONING, session-dispatched — Model-B) READS and WRITES:
 *
 *   1. WHICH eval leg applies — the subject-kind resolver. The eval leg's shape differs
 *      by subject kind (this is why W2I5 was gated behind W2I1's code-quality leg):
 *        - agent / skill / composite subject → the EVAL-SUITE criteria (the evaluator's
 *          discovered / maintained criteria for that subject).
 *        - code subject → the CODE-QUALITY criteria (W2I1's `DEFAULT_CODE_QUALITY_CRITERIA`
 *          / `#mode-judge-code-quality`).
 *   2. A deterministic STALENESS FLAG predicate — the eval-leg half of the drift trigger
 *      (mirrors the builder freshness probe's spec/code compare; same 3-value semantics).
 *   3. The monotonic APPLY primitive — the ai-architect reasons a criteria delta; this
 *      applies it as criteria MAINTENANCE: upsert-by-id, append the novel, and NEVER drop
 *      an existing criterion (EV-053, guarded by `assertMonotonicGrowth`).
 *
 * JUDGE-ONLY PRESERVED (EV-051): this file NEVER scores a subject and NEVER decides a
 * subject pass/fail. It FLAGS freshness (pure epoch compare) and GROWS a criteria set
 * (pure set algebra). The reconcile REASONING — which criteria a changed impl makes stale,
 * what new criterion it needs — is the ai-architect's, not this code's (Model-B: code =
 * drift predicates + deterministic maintenance only, never agent dispatch).
 *
 * PURE + deterministic (C-PIN): no clock / random / network; same inputs → byte-identical.
 */
import { type Static, Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import { assertMonotonicGrowth } from "./living-suite.ts";

// ── subject kind → eval leg ──────────────────────────────────────────────────

/** The subject kinds the triad reconciles. `agent|skill|composite` come from the
 *  agentspec `definition.identity.kind`; `code` is the ⑤ OPTIMIZE code-target subject. */
export const EvalSubjectKind = {
  Agent: "agent",
  Skill: "skill",
  Composite: "composite",
  Code: "code",
} as const;
export type EvalSubjectKindValue = (typeof EvalSubjectKind)[keyof typeof EvalSubjectKind];

/** Which eval leg grounds a subject's evaluation — the W2I5 core rule. */
export const EvalLegKind = {
  /** agent / skill / composite → the evaluator's discovered/maintained eval-suite criteria. */
  EvalSuite: "eval-suite",
  /** code → W2I1's code-quality criteria (`DEFAULT_CODE_QUALITY_CRITERIA`). */
  CodeQuality: "code-quality",
} as const;
export type EvalLegKindValue = (typeof EvalLegKind)[keyof typeof EvalLegKind];

/**
 * Resolve WHICH eval leg a subject kind reconciles against. Code subjects use the
 * code-quality criteria (a deterministic-test-gate PLUS a quality judge); every other
 * kind uses the discovered eval-suite criteria. This single mapping is the shape
 * differentiator the whole triad turns on.
 */
export function evalLegForSubjectKind(kind: EvalSubjectKindValue): EvalLegKindValue {
  return kind === EvalSubjectKind.Code ? EvalLegKind.CodeQuality : EvalLegKind.EvalSuite;
}

// ── the staleness flag predicate (eval-leg half of the drift trigger) ────────

/** The eval-leg freshness verdict — mirrors the builder freshness probe's 3-value spec/code semantics. */
export const EvalLegDrift = {
  /** no eval-criteria artifact yet — the eval leg must be CONSTRUCTED (cold). */
  MissingEval: "missing-eval",
  /** the eval criteria are as fresh as the impl — no reconcile write needed. */
  InSync: "in-sync",
  /** the impl is newer than the eval criteria — the eval leg is flagged for RECONCILE. */
  NeedsSync: "needs-sync",
} as const;
export type EvalLegDriftValue = (typeof EvalLegDrift)[keyof typeof EvalLegDrift];

/** Effective freshness epochs (seconds) the flag predicate compares. `null` = unknown/absent. */
export interface EvalLegFreshnessInput {
  /** effective freshness epoch of the eval-criteria artifact; `null` = artifact absent. */
  evalCriteriaEpoch: number | null;
  /** effective freshness epoch of the implementation; `null` = unknown. */
  implEpoch: number | null;
}

/**
 * FLAG whether the eval leg is stale w.r.t. the impl. Deterministic — a pure epoch
 * compare, identical in spirit to the builder `check-sync-spec` spec/code compare so the
 * two legs agree on "impl is newer → reconcile". This is a FLAG only: it decides nothing
 * about the subject and proposes no criteria — the reconcile reasoning is the agent's.
 */
export function flagEvalLegDrift(input: EvalLegFreshnessInput): EvalLegDriftValue {
  if (input.evalCriteriaEpoch == null) return EvalLegDrift.MissingEval;
  if (input.implEpoch != null && input.implEpoch > input.evalCriteriaEpoch) {
    return EvalLegDrift.NeedsSync;
  }
  return EvalLegDrift.InSync;
}

/** The resolved eval leg for a subject: which criteria kind + the current staleness flag. */
export interface EvalLegAssessment {
  leg: EvalLegKindValue;
  drift: EvalLegDriftValue;
}

/**
 * Convenience: resolve the eval leg for a subject kind AND flag its staleness in one
 * call — the exact pair the reconcile reads ("which leg, is it stale?").
 */
export function assessEvalLeg(
  subjectKind: EvalSubjectKindValue,
  freshness: EvalLegFreshnessInput,
): EvalLegAssessment {
  return { leg: evalLegForSubjectKind(subjectKind), drift: flagEvalLegDrift(freshness) };
}

// ── the criteria representation + the monotonic reconcile-apply ──────────────

/**
 * One eval criterion — subject-kind-agnostic (a stable `id` key + the binary `statement`,
 * plus the `leg` it belongs to and an optional severity). Serves BOTH legs: a code-quality
 * `Qn` criterion (`severity` ∈ critical|high|medium) and an eval-suite discovered criterion
 * flow through the same shape. `additionalProperties: true` keeps a richer criterion (e.g.
 * a code-quality `passDefinition`/`failDefinition`, an eval-suite `checkMethod`) forward-parsing.
 */
export const EvalCriterionSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    statement: Type.String({ minLength: 1 }),
    leg: Type.Union([Type.Literal(EvalLegKind.EvalSuite), Type.Literal(EvalLegKind.CodeQuality)]),
    severity: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: true },
);
export type EvalCriterion = Static<typeof EvalCriterionSchema>;

/**
 * The reconcile REQUEST the ai-architect emits: the persisted criteria `existing`, plus the
 * agent-reasoned `proposed` additions/updates. `proposed` is an UPSERT set (append the novel,
 * revise a same-id criterion's wording for the changed impl) — it is NEVER a delete list; the
 * monotonic-growth invariant (EV-053) forbids dropping a criterion.
 */
export const EvalCriteriaReconcileRequestSchema = Type.Object(
  {
    subjectId: Type.String({ minLength: 1 }),
    subjectKind: Type.Union([
      Type.Literal(EvalSubjectKind.Agent),
      Type.Literal(EvalSubjectKind.Skill),
      Type.Literal(EvalSubjectKind.Composite),
      Type.Literal(EvalSubjectKind.Code),
    ]),
    leg: Type.Union([Type.Literal(EvalLegKind.EvalSuite), Type.Literal(EvalLegKind.CodeQuality)]),
    existing: Type.Array(EvalCriterionSchema),
    proposed: Type.Array(EvalCriterionSchema),
  },
  { additionalProperties: false },
);
export type EvalCriteriaReconcileRequest = Static<typeof EvalCriteriaReconcileRequestSchema>;

/** Provenance for a reconcile — pure counters (NO clock, for byte-identity / C-PIN). */
export interface EvalCriteriaReconcileProvenance {
  /** how many genuinely-novel criteria were appended. */
  added: number;
  /** how many existing criteria (same id) had their content revised. */
  updated: number;
  /** total criteria after the reconcile. */
  total: number;
}

/** The reconcile RESULT — the grown/maintained criteria set + provenance. */
export interface EvalCriteriaReconcileResult {
  subjectId: string;
  leg: EvalLegKindValue;
  criteria: EvalCriterion[];
  provenance: EvalCriteriaReconcileProvenance;
}

/** Parse + narrow a reconcile request (guarded). THROWS on schema violation. PURE. */
export function parseEvalCriteriaReconcileRequest(value: unknown): EvalCriteriaReconcileRequest {
  if (!Value.Check(EvalCriteriaReconcileRequestSchema, value)) {
    const first = [...Value.Errors(EvalCriteriaReconcileRequestSchema, value)][0];
    throw new Error(
      `parseEvalCriteriaReconcileRequest: schema violation at '${first?.path ?? "(root)"}': ` +
        `${first?.message ?? "invalid eval-criteria reconcile request"}`,
    );
  }
  return value;
}

const criterionId = (c: EvalCriterion): string => c.id;

/**
 * APPLY the reconcile: maintain the eval-criteria set for a changed impl. Criteria
 * MAINTENANCE, not judging (EV-051): upsert each `proposed` criterion by `id` (revise a
 * same-id criterion's content in place, keeping the id), append the genuinely-novel, and
 * assert the id-set NEVER shrank (EV-053, via the shared `assertMonotonicGrowth`). The
 * `leg` on every proposed criterion must match the request's `leg` — mixing a code-quality
 * criterion into an eval-suite reconcile (or vice versa) is a hard error, not a silent
 * accept. DETERMINISTIC + PURE: existing order preserved, novel appended in proposal order;
 * no clock / random. Same (existing, proposed) → byte-identical result.
 */
export function reconcileEvalCriteria(
  request: EvalCriteriaReconcileRequest,
): EvalCriteriaReconcileResult {
  const req = parseEvalCriteriaReconcileRequest(request);

  for (const p of req.proposed) {
    if (p.leg !== req.leg) {
      throw new Error(
        `reconcileEvalCriteria: proposed criterion '${p.id}' has leg '${p.leg}' but the ` +
          `reconcile targets leg '${req.leg}'. An eval-suite and a code-quality criterion ` +
          "are different legs — refusing to mix them (subject-kind integrity).",
      );
    }
  }

  // Insertion-ordered upsert: existing order first (content possibly revised), novel appended.
  const byId = new Map<string, EvalCriterion>();
  for (const c of req.existing) byId.set(c.id, c);

  let added = 0;
  let updated = 0;
  for (const p of req.proposed) {
    if (byId.has(p.id)) {
      byId.set(p.id, p); // revise content, id (and thus the key/order) retained
      updated += 1;
    } else {
      byId.set(p.id, p); // novel → appended after the existing keys
      added += 1;
    }
  }

  const criteria = [...byId.values()];
  // EV-053: a maintained criteria set may GROW or revise, but never DROP a criterion.
  assertMonotonicGrowth(req.existing, criteria, criterionId);

  return {
    subjectId: req.subjectId,
    leg: req.leg,
    criteria,
    provenance: { added, updated, total: criteria.length },
  };
}
