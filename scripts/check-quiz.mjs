// Regression + fairness checks for the quiz's scoring.
//
// The quiz is plain HTML in public/, so `npm run build` copies it through
// without validating it — a syntax error would ship with a green build. This
// pulls the real scoring functions out of the page and exercises them.
//
//   npm run check:quiz
//
// Run it after editing questions. Checks 1–4 are the regression gate; the
// fairness section (5–8) measures structural balance and simulates responder
// behavior (uniform, acquiescent, partisan) with a fixed seed so runs are
// reproducible.

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
    grab("chanceProfile"),
    grab("computeExposure"),
    grab("toPercent"),
    grab("computeTotals"),
    "return {Q,chanceProfile,computeExposure,toPercent,computeTotals,setAnswers:a=>{answers=a}};",
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
let warnings = 0;
function check(label, ok) {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
}
function warn(label, ok) {
  if (!ok) warnings++;
  console.log(`  ${ok ? "OK  " : "WARN"}  ${label}`);
}

/** Deterministic PRNG so simulation results are reproducible. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Points option `o` gives `target` (0 if none). */
const optPts = (o, target) => (o.pts ? o.pts[target] || 0 : o.y === target ? 2 : 0);

/** An answer sheet pushing as hard as possible toward one type. */
function lopsided(target) {
  return M.Q.map((q) => {
    if (q.kind === "L") {
      if (q.agree === target) return 0;
      if (q.disagree === target) return 4;
      return null;
    }
    // Highest-value option for the target (Q20 lists a type twice).
    let best = -1, bestPts = 0;
    q.opts.forEach((o, i) => {
      if (optPts(o, target) > bestPts) { bestPts = optPts(o, target); best = i; }
    });
    return best >= 0 ? best : null;
  });
}

/** Mirrors the chance-corrected scoring path in showResults(). */
function score(sheet) {
  M.setAnswers(sheet);
  const { t, base } = M.computeTotals();
  const exposure = M.computeExposure();
  const lean = {};
  const share = {};
  KEYS.forEach((k) => {
    lean[k] = exposure[k] ? (t[k] - base[k]) / exposure[k] : 0;
    share[k] = Math.max(0, lean[k]);
  });
  const shareSum = KEYS.reduce((a, k) => a + share[k], 0);
  return {
    lean,
    share,
    pct: M.toPercent(KEYS, share, shareSum),
    sorted: KEYS.slice().sort((a, b) => lean[b] - lean[a]),
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

console.log("\n4. Equal ceiling: every type's best sheet reaches share 1.000");
{
  // Chance-corrected scoring must give each type the same attainable
  // maximum — a perfect partisan of any type fills exactly 100% of that
  // type's headroom, so no type has a taller or shorter ladder.
  for (const target of KEYS) {
    const r = score(lopsided(target));
    check(
      `all-${NAMES[target]} reaches ${r.lean[target].toFixed(4)}`,
      Math.abs(r.lean[target] - 1) < 1e-9
    );
  }
}

// ---------------------------------------------------------------- fairness

console.log("\n5. Structural balance");
{
  const pole = {};
  KEYS.forEach((k) => (pole[k] = { a: 0, d: 0 }));
  const first = { O: 0, T: 0, F: 0, P: 0 };
  let missingType = 0;
  for (const q of M.Q) {
    if (q.kind === "L") {
      pole[q.agree].a++;
      pole[q.disagree].d++;
    } else {
      const o = q.opts[0];
      if (o.y) first[o.y]++;
      else Object.keys(o.pts).forEach((k) => first[k] && 0); // split firsts: uncounted
      const present = new Set();
      q.opts.forEach((o) => {
        if (o.y) present.add(o.y);
        else Object.keys(o.pts).forEach((k) => present.add(k));
      });
      if (!KEYS.every((k) => present.has(k))) missingType++;
    }
  }
  console.log(
    "  Likert poles (agree/disagree):",
    KEYS.map((k) => `${k} ${pole[k].a}a/${pole[k].d}d`).join("  ")
  );
  console.log("  first-listed option (authored order):", JSON.stringify(first));
  check("every multi-choice question covers all four types", missingType === 0);
  console.log(
    "  note: authored first-position is moot once render-time shuffling ships;"
  );
  console.log("  the pole matrix is mitigated by the agree half-weight rule.");
}

console.log("\n6. Uniform decisive responder x20k (gate: 25% ± 4)");
{
  const rand = mulberry32(20260726);
  const wins = { O: 0, T: 0, F: 0, P: 0 };
  let ties = 0;
  const N = 20000;
  for (let n = 0; n < N; n++) {
    const sheet = M.Q.map((q) => {
      if (q.kind === "L") return [0, 1, 3, 4][(rand() * 4) | 0];
      if (q.kind === "RANK") {
        const a = (rand() * q.opts.length) | 0;
        let b = (rand() * (q.opts.length - 1)) | 0;
        if (b >= a) b++;
        return { first: a, second: b };
      }
      return (rand() * q.opts.length) | 0;
    });
    const r = score(sheet);
    wins[r.sorted[0]]++;
    if (r.lean[r.sorted[0]] === r.lean[r.sorted[1]]) ties++;
  }
  const pctWins = {};
  KEYS.forEach((k) => (pctWins[k] = +((wins[k] / N) * 100).toFixed(1)));
  console.log("  winner distribution:", JSON.stringify(pctWins));
  console.log(`  exact top-two ties: ${((ties / N) * 100).toFixed(2)}% (broken toward O by stable sort)`);
  check(
    "every type within 25% ± 4pts",
    KEYS.every((k) => pctWins[k] >= 21 && pctWins[k] <= 29)
  );
  warn("tie rate under 0.5%", ties / N < 0.005);
}

console.log("\n7. Acquiescent responder x20k (agrees far more than disagrees)");
{
  const rand = mulberry32(19100406);
  // SA .35 / A .35 / N .10 / D .15 / SD .05 — neutral counts as unsure.
  const pick = () => {
    const x = rand();
    if (x < 0.35) return 0;
    if (x < 0.7) return 1;
    if (x < 0.8) return 2;
    if (x < 0.95) return 3;
    return 4;
  };
  const wins = { O: 0, T: 0, F: 0, P: 0 };
  const N = 20000;
  for (let n = 0; n < N; n++) {
    const sheet = M.Q.map((q) => {
      if (q.kind === "L") return pick();
      if (q.kind === "RANK") {
        const a = (rand() * q.opts.length) | 0;
        let b = (rand() * (q.opts.length - 1)) | 0;
        if (b >= a) b++;
        return { first: a, second: b };
      }
      return (rand() * q.opts.length) | 0;
    });
    wins[score(sheet).sorted[0]]++;
  }
  const pctWins = {};
  KEYS.forEach((k) => (pctWins[k] = +((wins[k] / N) * 100).toFixed(1)));
  console.log("  winner distribution:", JSON.stringify(pctWins));
  warn(
    "no type wins more than 32% of agreeable takers",
    KEYS.every((k) => pctWins[k] <= 32)
  );
}

console.log("\n8. Noisy partisans x5k each (gate: recoverability spread ≤ 5pts)");
{
  const rand = mulberry32(18441890);
  const rate = {};
  for (const target of KEYS) {
    let wins = 0;
    const N = 5000;
    for (let n = 0; n < N; n++) {
      const sheet = M.Q.map((q) => {
        const own = rand() < 0.6;
        if (q.kind === "L") {
          if (own && q.agree === target) return 0;
          if (own && q.disagree === target) return 4;
          return [0, 1, 3, 4][(rand() * 4) | 0];
        }
        const mine = q.opts.findIndex((o) =>
          o.pts ? o.pts[target] : o.y === target
        );
        if (q.kind === "RANK") {
          if (own && mine >= 0) {
            let b = (rand() * (q.opts.length - 1)) | 0;
            if (b >= mine) b++;
            return { first: mine, second: b };
          }
          const a = (rand() * q.opts.length) | 0;
          let b = (rand() * (q.opts.length - 1)) | 0;
          if (b >= a) b++;
          return { first: a, second: b };
        }
        if (own && mine >= 0) return mine;
        return (rand() * q.opts.length) | 0;
      });
      if (score(sheet).sorted[0] === target) wins++;
    }
    rate[target] = +((wins / N) * 100).toFixed(1);
  }
  console.log("  win rate for own type:", JSON.stringify(rate));
  const spread =
    Math.max(...KEYS.map((k) => rate[k])) - Math.min(...KEYS.map((k) => rate[k]));
  check(`recoverability spread is ${spread.toFixed(1)}pts (≤ 5)`, spread <= 5);
}

console.log(
  failures
    ? `\n${failures} check(s) FAILED${warnings ? `, ${warnings} warning(s)` : ""}\n`
    : `\nAll checks passed${warnings ? ` — ${warnings} warning(s) to review` : ""}\n`
);
process.exit(failures ? 1 : 0);
