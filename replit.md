# Yahya — Portfolio

Imported creative portfolio, migrated from a static Next.js export to a React + Vite app in the pnpm workspace. Preserve the original design and product flows.

## Run & Operate

- Start the managed workflow `artifacts/portfolio: web` to run the app.
- The workflow provides `PORT` and `BASE_PATH`; do not run a root-level dev command.
- `node --test artifacts/portfolio/tests/migration.test.mjs` checks content validity, local media, route coverage, and removal of Next.js imports.

## Project layout

- `artifacts/portfolio/` — the migrated web app, public media, and migration checks.
- `.migration-backup/` — original imported source, retained as the parity reference.
- `artifacts/api-server/`, `artifacts/mockup-sandbox/`, `lib/` — existing workspace scaffold; the portfolio does not require these services to run.

## Existing services

The app continues to use its original Supabase project for published content, administrator authentication, draft publishing, image uploads, and inquiry submission. Do not migrate or replace that database without explicit permission.

The bundled content is the original app's initial snapshot. Authenticated admin functions require an existing authorized Supabase account. The `/start` flow requests a preferred meeting time; it must not claim the meeting is confirmed.

## Migration scope

Preserve `/`, `/work`, `/work/:slug`, `/start`, `/admin`, and the original query-string project links. The original port preserved the app; the user subsequently requested a professional black/gray redesign without an AI-generated feel. Keep personal imagery monochrome, real project screenshots in color, and avoid decorative glow, cursor effects, or cinematic interruptions. Preserve content and interaction behavior.
