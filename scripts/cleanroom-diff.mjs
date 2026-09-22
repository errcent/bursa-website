/**
 * Clean-room spot-check: no >2 consecutive identical non-trivial lines
 * between Bursa Note analytics sources and the LuxAlgo reference clone.
 *
 * Run: node scripts/cleanroom-diff.mjs [lux-root]
 * Default lux-root: C:\Users\esa\Documents\Omni\Trade Journal
 * Exit 0 = clean. Prints violating spans otherwise.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const LUX_ROOT = process.argv[2] ?? "C:\\Users\\esa\\Documents\\Omni\\Trade Journal";

const PAIRS = [
  ["src/lib/note/position/cycle.ts", "packages/core/src/round-trips.ts"],
  ["src/lib/note/position/matcher.ts", "packages/core/src/round-trips.ts"],
  ["src/lib/note/position/finalize.ts", "packages/core/src/round-trips.ts"],
  ["src/lib/note/position/types.ts", "packages/core/src/types.ts"],
  ["src/lib/note/edge-dialect.ts", "packages/core/src/edge-score.ts"],
  ["src/lib/note/csv.ts", "packages/importers/src/csv.ts"],
  ["src/lib/note/statements/sections.ts", "packages/importers/src/csv.ts"],
  ["src/lib/note/statements/html.ts", "packages/importers/src/csv.ts"],
  ["src/lib/note/statements/timezone.ts", "packages/importers/src/dates.ts"],
  ["src/lib/note/metrics/core.ts", "packages/core/src/metrics.ts"],
  ["src/lib/note/metrics/risk.ts", "packages/core/src/metrics.ts"],
  ["src/lib/note/metrics/overview.ts", "packages/core/src/equity.ts"],
];

const normalize = (line) =>
  line.trim().replace(/\s+/g, " ").replace(/["']/g, "'");
const trivial = (line) => {
  const t = line.trim();
  return (
    t === "" ||
    t.length < 12 ||
    /^[{}();,\]]+$/.test(t) ||
    t.startsWith("import ") ||
    t.startsWith("export ") ||
    t.startsWith("*") ||
    t.startsWith("//") ||
    t.startsWith("/**") ||
    t === "}," ||
    t === "});"
  );
};

let violations = 0;
for (const [bursaRel, luxRel] of PAIRS) {
  const bursaPath = join(process.cwd(), bursaRel);
  const luxPath = join(LUX_ROOT, luxRel);
  if (!existsSync(bursaPath)) {
    console.log(`SKIP (missing bursa): ${bursaRel}`);
    continue;
  }
  if (!existsSync(luxPath)) {
    console.log(`SKIP (missing lux): ${luxRel}`);
    continue;
  }
  const bursaLines = readFileSync(bursaPath, "utf8").split(/\r?\n/);
  const luxSet = new Set(
    readFileSync(luxPath, "utf8").split(/\r?\n/).filter((l) => !trivial(l)).map(normalize),
  );
  let run = 0;
  for (const line of bursaLines) {
    if (trivial(line)) {
      run = 0;
      continue;
    }
    if (luxSet.has(normalize(line))) {
      run += 1;
      if (run > 2) {
        violations += 1;
        console.log(`VIOLATION ${bursaRel}: 3+ consecutive identical lines near: ${line.trim().slice(0, 90)}`);
        run = 0;
      }
    } else {
      run = 0;
    }
  }
}
console.log(violations === 0 ? "CLEANROOM OK: no violations." : `CLEANROOM FAIL: ${violations} span(s).`);
process.exit(violations === 0 ? 0 : 1);
