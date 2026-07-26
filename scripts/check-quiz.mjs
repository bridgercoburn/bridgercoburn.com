// Regression check for the quiz's scoring.
//
// The quiz is plain HTML in public/, so `npm run build` copies it through
// without validating it — a syntax error would ship with a green build. This
// pulls the real scoring functions out of the page and exercises them.
//
//   npm run check:quiz
//
// Run it after editing questions. Adding or removing questions changes how
// much each type is represented, and check 4 is what proves that still comes
// out fair.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "public/lds-quiz/index.html"), "utf8");

/** Extract a top-level function from the page by brace matching. */
function grab(name) {
  const i = src.indexOf("function " + name);
  if (i < 0) throw new Error(`missing function ${name}`);
  let depth = 0;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    if (src[k] === "{") depth++;
    else if (src[k] === "}" && --depth === 0) return src.slice(i, k + 1);
  }
  throw new Error(`unbalanced braces in ${name}`);
}

const qsrc = src.slice(src.indexOf("const Q = ["));
const Qarr = qsrc.slice(qsrc.indexOf("["), qsrc.indexOf("];") + 1);

const M = new Function(
  [
    "const Q=" + Qarr + ";",
    "let answers=new Array(Q.length).fill(null);",
    grab("addPts"),
    grab("computeExposure"),
    grab("toPercent"),
    grab("computeTotals"),
    "return {Q,computeExposure,toPercent,computeTotals,setAnswers:a=>{answers=a}};",
  ].join("\n")
)();

const KEYS = ["O", "T", "F", "P"];
const NAMES = {
  O: "Orthodox",
  T: "Traditional",
  F: "Fundamental",
  P: "Progressive",
};

let failures = 0;
function check(label, ok) {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
}

/** An answer sheet pushing as hard as possible toward one type. */
function lopsided(target) {
  return M.Q.map((q) => {
    if (q.kind === "L") {
      if (q.agree === target) return 0;
      if (q.disagree === target) return 4;
      return null;
    }
    const i = q.opts.findIndex((o) => (o.pts ? o.pts[target] : o.y === target));
    return i >= 0 ? i : null;
  });
}

/** Mirrors the scoring path in showResults(). */
function score(sheet) {
  M.setAnswers(sheet);
  const { t } = M.computeTotals();
  const exposure = M.computeExposure();
  const share = {};
  KEYS.forEach((k) => (share[k] = exposure[k] ? t[k] / exposure[k] : 0));
  const shareSum = KEYS.reduce((a, k) => a + share[k], 0);
  return {
    pct: M.toPercent(KEYS, share, shareSum),
    sorted: KEYS.slice().sort((a, b) => share[b] - share[a]),
  };
}

console.log(`\nQuiz loaded: ${M.Q.length} questions`);
const exposure = M.computeExposure();
console.log("Points available per type:", JSON.stringify(exposure));

console.log("\n1. Lopsided runs land on the intended type");
for (const target of KEYS) {
  const r = score(lopsided(target));
  check(`all-${NAMES[target]} -> ${NAMES[r.sorted[0]]}`, r.sorted[0] === target);
}

console.log("\n2. Percentages total exactly 100");
for (const target of KEYS) {
  const total = KEYS.reduce((a, k) => a + score(lopsided(target)).pct[k], 0);
  check(`all-${NAMES[target]} sums to ${total}`, total === 100);
}

console.log("\n3. An empty sheet stays at zero");
{
  const r = score(new Array(M.Q.length).fill(null));
  check(
    "no answers -> all zero, no NaN",
    KEYS.every((k) => r.pct[k] === 0)
  );
}

console.log("\n4. Equal effort on all four types scores even");
{
  // Each type earns the same fraction of what is available to it. A fair
  // scorer must return 25/25/25/25 no matter how often each type appears.
  const raw = {};
  KEYS.forEach((k) => (raw[k] = exposure[k] * 0.5));
  const share = {};
  KEYS.forEach((k) => (share[k] = exposure[k] ? raw[k] / exposure[k] : 0));
  const pct = M.toPercent(
    KEYS,
    share,
    KEYS.reduce((a, k) => a + share[k], 0)
  );
  const spread =
    Math.max(...KEYS.map((k) => pct[k])) - Math.min(...KEYS.map((k) => pct[k]));
  console.log("  result:", JSON.stringify(pct));
  check(`spread is ${spread}, expected 0 or 1`, spread <= 1);
}

console.log(failures ? `\n${failures} check(s) FAILED\n` : "\nAll checks passed\n");
process.exit(failures ? 1 : 0);
