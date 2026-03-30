# Survey120 — Church Leader Survey

Private research survey built with **Next.js 16**, **Tailwind CSS**, and **Airtable** (relational base: Churches, Respondents, Survey Waves, Survey Responses).

## Setup

```bash
npm install
cp env.example .env.local
```

Edit `.env.local` with your Airtable personal access token and base ID (never commit `.env.local`).

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
