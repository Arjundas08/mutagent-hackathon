/**
 * scripts/normalize/read-unitf.ts
 * The STRANGLER entry point: read a handed-over UniTF JSONL (+ optional
 * `manifest.json`) and project it, via the adapter, into the skill's canonical
 * `TraceBody[]` / `TraceMetadata[]` / `EntityContext`.
 * Type A — Pure Script for the parse/project core; a thin `import.meta.main` file
 * transport mirrors the other normalizers (REQ-052).
 *
 * Replaces (additively, at read time) the whole `scripts/fetch/*` +
 * `scripts/normalize/platforms/*` fetch/normalize stack: after migration the
 * orchestrator reads `traces.jsonl` produced by `mutagent-cli` from the
 * HandoverBundle inputs[], instead of fetching + per-platform normalizing inside
 * the skill. See ../../../mutagent-tools/references/MIGRATION-diagnostics-evaluator.md
 * §2.2 (new ingestion entry point) + §4.2 (Helix drives the CLI pre-stage).
 *
 * Tolerance contract mirrors local-jsonl `normalizeLocalJsonlFileWithDrops`:
 * blank lines skipped; lines that fail JSON.parse OR are not UniTF-shaped are
 * COUNTED + SAMPLED (tolerant-but-visible) and NEVER abort the corpus. Manifest
 * validation surfaces WARNINGS (format / count / truncation) but never aborts a
 * partial export — matches the existing partial-load behavior.
 */

import type { EntityContext, TraceBody, TraceMetadata } from "./trace.ts";
import type { UnifiedTrace, UnitfTraceManifest } from "./unitf-types.ts";
import { UNITF_MANIFEST_FORMAT, isUnifiedTraceLike } from "./unitf-types.ts";
import {
  projectUniTFEntityContext,
  projectUniTFToTraceBody,
} from "./unitf-adapter.ts";

/** Default number of raw bad-line samples retained for operator triage. */
export const DEFAULT_UNITF_DROPPED_SAMPLE_LIMIT = 5;

/** Tolerant-but-visible parse of a UniTF JSONL string. Deterministic. */
export interface UniTFParseResult {
  traces: UnifiedTrace[];
  /** Lines dropped: failed JSON.parse OR parsed-but-not-a-UniTF-record. */
  droppedLineCount: number;
  /** First-N raw dropped lines (verbatim), capped at the sample limit. */
  droppedSamples: string[];
}

/**
 * Parse a UniTF JSONL string into `UnifiedTrace[]` with VISIBLE drops. One record
 * per line (NDJSON). Blank lines are skipped and NOT counted as drops. A line that
 * parses as JSON but fails the structural `isUnifiedTraceLike` guard is counted as
 * a drop (so a stray non-UniTF record never reaches the projection).
 */
export function parseUniTFJsonl(
  content: string,
  sampleLimit: number = DEFAULT_UNITF_DROPPED_SAMPLE_LIMIT,
): UniTFParseResult {
  const traces: UnifiedTrace[] = [];
  let droppedLineCount = 0;
  const droppedSamples: string[] = [];

  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      droppedLineCount += 1;
      if (droppedSamples.length < sampleLimit) droppedSamples.push(line);
      continue;
    }
    if (isUnifiedTraceLike(parsed)) {
      traces.push(parsed);
    } else {
      droppedLineCount += 1;
      if (droppedSamples.length < sampleLimit) droppedSamples.push(line);
    }
  }

  return { traces, droppedLineCount, droppedSamples };
}

/**
 * Validate a parsed manifest against the parsed trace count. Returns WARNINGS
 * (never throws, never aborts). Empty array = clean. Mirrors the migration's
 * "surface warnings but do NOT abort a partial export" rule.
 */
export function validateUniTFManifest(
  manifest: UnitfTraceManifest | undefined,
  actualTraceCount: number,
): string[] {
  const warnings: string[] = [];
  if (!manifest) return warnings;
  if (manifest.format !== undefined && manifest.format !== UNITF_MANIFEST_FORMAT) {
    warnings.push(
      `manifest.format is "${manifest.format}" — expected "${UNITF_MANIFEST_FORMAT}"`,
    );
  }
  if (manifest.count !== undefined && manifest.count !== actualTraceCount) {
    warnings.push(
      `manifest.count (${manifest.count}) != parsed trace count (${actualTraceCount})`,
    );
  }
  if (manifest.truncated === true) {
    warnings.push(
      `export is truncated${manifest.truncationReason ? ` (${manifest.truncationReason})` : ""} — diagnosing a partial slice`,
    );
  }
  if (manifest.warnings) warnings.push(...manifest.warnings);
  return warnings;
}

/** Full result of reading a handed-over UniTF export. */
export interface UniTFReadResult {
  /** One projected TraceBody per UniTF record (RCA input). */
  bodies: TraceBody[];
  /** Convenience: the metadata list (== bodies.map(b => b.metadata)). */
  metadata: TraceMetadata[];
  /** Entity context projected from the batch (ext.agent overlay). */
  entity: EntityContext;
  /** Count of successfully-projected records. */
  traceCount: number;
  /** Dropped-line accounting (thread into RunMeta.partial_loads). */
  droppedLineCount: number;
  droppedSamples: string[];
  /** Manifest warnings (format / count / truncation) — non-fatal. */
  manifestWarnings: string[];
}

/**
 * Pure core: project a UniTF JSONL string (+ optional manifest JSON string) into
 * the diagnostics ingestion shapes. No I/O — testable without a filesystem.
 */
export function readUniTFHandoverFromStrings(
  jsonlContent: string,
  manifestContent?: string,
  opts?: { source?: string; fallbackName?: string },
): UniTFReadResult {
  const { traces, droppedLineCount, droppedSamples } = parseUniTFJsonl(jsonlContent);

  let manifest: UnitfTraceManifest | undefined;
  if (manifestContent && manifestContent.trim()) {
    try {
      manifest = JSON.parse(manifestContent) as UnitfTraceManifest;
    } catch {
      manifest = undefined; // unreadable manifest is non-fatal (warn below via count)
    }
  }
  const manifestWarnings = validateUniTFManifest(manifest, traces.length);
  if (manifestContent && manifestContent.trim() && !manifest) {
    manifestWarnings.push("manifest.json failed to parse — proceeding without it");
  }

  const bodies = traces.map(projectUniTFToTraceBody);
  const entity = projectUniTFEntityContext(traces, opts);

  return {
    bodies,
    metadata: bodies.map((b) => b.metadata),
    entity,
    traceCount: traces.length,
    droppedLineCount,
    droppedSamples,
    manifestWarnings,
  };
}

/**
 * Read a handed-over UniTF export from disk (the HandoverBundle inputs[] paths)
 * and project it. `manifestPath` is optional — when present its warnings are
 * surfaced but never abort. Deterministic given identical file contents.
 */
export async function readUniTFHandover(args: {
  jsonlPath: string;
  manifestPath?: string;
  source?: string;
  fallbackName?: string;
}): Promise<UniTFReadResult> {
  const { readFileSync } = await import("fs");
  const jsonlContent = readFileSync(args.jsonlPath, "utf8");
  const manifestContent = args.manifestPath
    ? readFileSync(args.manifestPath, "utf8")
    : undefined;
  return readUniTFHandoverFromStrings(jsonlContent, manifestContent, {
    ...(args.source ? { source: args.source } : {}),
    ...(args.fallbackName ? { fallbackName: args.fallbackName } : {}),
  });
}

// ── REQ-052: INTERNAL CLI transport ───────────────────────────────────────────
//
// Mirrors the local-jsonl file transport so the strangler entry point is runnable
// via scripts/cli/run.sh without inline `bun -e` glue (banned by R-SELF-03-c).
//
//   run.sh scripts/normalize/read-unitf.ts \
//     --in <traces.jsonl> \
//     [--manifest <manifest.json>] \
//     [--out-metadata <traces-metadata.json>] \
//     [--out-entity <entity-context.json>]
//
// --in is a UniTF .jsonl (one UnifiedTrace per line). Bad/non-UniTF lines are
// tolerated-but-visible: the dropped count + manifest warnings go to stderr.
// ≥1 --out-* is required. Deterministic — no clock/random/network/LLM.

if (import.meta.main) {
  const { readFileSync, writeFileSync } = await import("fs");
  const { resolve } = await import("path");

  const argv = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  const inPath = get("--in");
  const manifestPath = get("--manifest");
  const outMetadataPath = get("--out-metadata");
  const outEntityPath = get("--out-entity");

  if (!inPath || (!outMetadataPath && !outEntityPath)) {
    process.stderr.write(
      "Usage: run.sh scripts/normalize/read-unitf.ts --in <traces.jsonl> " +
        "[--manifest <manifest.json>] [--out-metadata <path>] [--out-entity <path>]\n",
    );
    process.exit(1);
  }

  try {
    const jsonlContent = readFileSync(resolve(inPath), "utf8");
    const manifestContent = manifestPath
      ? readFileSync(resolve(manifestPath), "utf8")
      : undefined;
    const result = readUniTFHandoverFromStrings(jsonlContent, manifestContent);

    if (result.droppedLineCount > 0) {
      process.stderr.write(
        `[read-unitf] dropped ${result.droppedLineCount} non-UniTF/unparseable line(s)\n`,
      );
    }
    for (const w of result.manifestWarnings) {
      process.stderr.write(`[read-unitf] manifest warning: ${w}\n`);
    }

    if (outMetadataPath) {
      writeFileSync(
        resolve(outMetadataPath),
        JSON.stringify(result.metadata, null, 2),
        "utf8",
      );
      process.stdout.write(
        `TraceMetadata[] (${result.metadata.length}) written to: ${outMetadataPath}\n`,
      );
    }
    if (outEntityPath) {
      writeFileSync(
        resolve(outEntityPath),
        JSON.stringify(result.entity, null, 2),
        "utf8",
      );
      process.stdout.write(`EntityContext written to: ${outEntityPath}\n`);
    }

    process.exit(0);
  } catch (err) {
    process.stderr.write(`Error: ${err}\n`);
    process.exit(1);
  }
}
