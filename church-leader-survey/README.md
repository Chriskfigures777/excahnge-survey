# Survey120 — Church Leader Survey

Private research survey built with **Next.js 16**, **Tailwind CSS**, and **Airtable** (relational base: Churches, Respondents, Survey Waves, Survey Responses).

## Setup

```bash
npm install
cp env.example .env.local
```

Edit `.env.local` with your Airtable personal access token and base ID (never commit `.env.local`).

## What’s on GitHub

This repo is **complete for the application**: every source file, config, and `package-lock.json` is committed. After `git clone`, you still run `npm install` locally because **large or secret files are intentionally not in Git** (standard for Node/Next):

| Item | Why it isn’t in the repo |
|------|---------------------------|
| `node_modules/` | Huge; recreated from `package-lock.json` via `npm install` |
| `.next/` | Build cache; recreated with `npm run build` or `npm run dev` |
| `.env`, `.env.local` | API tokens and secrets; keep only on your machine (use `env.example` as a template) |
| `*.tsbuildinfo`, `next-env.d.ts` | Generated TypeScript/Next artifacts |

Nothing important is “missing” from GitHub—those paths are excluded so the repo stays small, safe, and fast to clone.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run airtable:setup` | Create tables via Airtable Metadata API (needs `schema.bases:write`) |
| `npm run test:airtable-meta` | Smoke test: meta GET + sample POSTs |
| `npm run test:airtable-form` | Verify form → Airtable field mapping |

## Airtable

Survey Responses use **section-labeled columns** (e.g. `S1 — Role within church`) plus seven tail fields for pricing / gospel / pilot / referral, so grids match the form. Legacy bases with `Q1`…`Q30` can set `AIRTABLE_USE_LEGACY_Q_FIELD_NAMES=1`. See `src/lib/survey-airtable-fields.ts` and `src/lib/map-survey-to-airtable.ts`.

## Deploy

Compatible with [Vercel](https://vercel.com); set the same environment variables in the project settings.
