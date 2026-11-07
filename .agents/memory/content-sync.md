---
name: Portfolio content lives in Supabase
description: Editing src/content/portfolio.json alone does not change the live site; the published database row wins.
---

The public site loads `portfolio_content` rows (`published`, and `draft` for preview tabs) from Supabase and only falls back to the bundled JSON while loading. Copy edits must be written to both the JSON snapshot and the database rows, bumping `version` so the admin's optimistic concurrency keeps working.

**Why:** The JSON and database matched exactly when checked, so a JSON-only edit silently disappears once the fetch completes, and a database-only edit breaks the migration test that validates the snapshot.

**How to apply:** For text changes, update the JSON, then run a management-API SQL update (`scripts/supabase-management.mjs` needs `SUPABASE_TARGET_REF` set explicitly) on both rows after confirming they still deep-equal the previous JSON; never overwrite admin edits blindly.
