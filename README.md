# bridgercoburn.com

Next.js site hosted on Netlify. Deploys automatically on every push to `main`.

Next.js is set to **static export** (`output: "export"` in `next.config.ts`), so
`npm run build` writes a plain HTML/CSS/JS site to `out/` and Netlify serves
those files directly. No server runtime, nothing to keep awake.

## Structure

```
.
├── src/
│   ├── app/
│   │   ├── layout.tsx      # shared shell (gilt edge, fonts, metadata)
│   │   ├── page.tsx        # homepage (bridgercoburn.com)
│   │   └── globals.css     # color palette and base type
│   └── lib/
│       └── posts.ts        # the post list the homepage renders
├── public/
│   └── lds-quiz/
│       └── index.html      # the quiz (bridgercoburn.com/lds-quiz)
└── netlify.toml            # build command and publish directory
```

Anything in `public/` is copied to the site verbatim. That is why the quiz is
still one self-contained HTML file — it has no external dependencies and no
build step, so there was no reason to rewrite it as React.

## Working on the site

```bash
npm install     # once
npm run dev     # http://localhost:3000
npm run build   # writes out/ — same build Netlify runs
```

Run `npm run build` before pushing. If it fails locally it will fail on Netlify,
and a failed build means the live site keeps serving the previous version.

## Adding a post

Add an entry to the `posts` array in `src/lib/posts.ts`. Newest goes first.

For a **plain HTML post**, create `public/<slug>/index.html` and point `href` at
`/<slug>/`.

For a **React post**, create `src/app/<slug>/page.tsx` and point `href` at the
same path. `trailingSlash: true` is set, so both kinds of URL end in a slash and
behave identically.

## Editing the quiz

Everything lives in `public/lds-quiz/index.html`: markup, styles, questions,
scoring.

All 50 questions are in the `const Q = [` array. Each question is one object:

- `sec` — section index (0–6), maps to the `SECTIONS` array
- `kind` — `'L'` (agree/disagree), `'MC'` (multiple choice), `'RANK'` (pick 1st and 2nd)
- `title` — the question or quote
- `ctx` — plain-language background shown under "Context"
- `src` — sources line, shown in smaller type below the context
- For `'L'`: `agree` and `disagree` name the type earning points at each pole
- For `'MC'` / `'RANK'`: `opts` is an array of `{y: 'O'|'T'|'F'|'P', t: 'answer text'}`
  - An option can use `pts` instead of `y` for a split score, e.g. `{pts:{O:1.5,P:0.5}, t:'...'}`

Scoring is **chance-corrected**: each answer earns its points minus what a
random clicker would earn in expectation (`chanceProfile()`), and each type's
percentage is its points above chance as a share of the headroom it had
(`computeExposure()`). For display, those leans are lifted by a common floor
(`LEAN_SHIFT`) so all four types keep a visible slice — ordering and the
winner always come from the raw leans. On agree/disagree questions, agreement is worth half
of disagreement, because agreeing is the cheaper answer (acquiescence bias).
Answer options are shuffled per attempt (`optOrder`) so no type benefits from
being listed first; `answers[]` always stores original option indices.

`npm run check:quiz` verifies all of this — regression checks plus seeded
simulations (uniform, acquiescent, and partisan responders). Run it after any
question or scoring edit.

Scoring lives in `computeTotals()`. Result write-ups: `DOMINANT_SUMMARY` (one
clear leader), `PAIR_SUMMARY` (12 ordered two-way results — `'OT'` means
Orthodox leading with Traditional second, distinct from `'TO'`),
`hedgedSummary()` (leading but with many unsures), and `NO_SIGNAL_SUMMARY`
(too many unsures to categorize). Thresholds are `DOMINANT_GAP`, `HEDGED_MIN`,
and `NO_SIGNAL_MIN` next to those constants. `TYPE_SUMMARY` holds the four
category descriptions shown in the expanders under the result.

The quiz carries its own copy of the color palette. It does not read
`globals.css`, so a color change in one place needs the same change in the
other.
