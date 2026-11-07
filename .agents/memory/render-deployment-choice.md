---
name: Render deployment choice
description: Why this portfolio supports Render Web Service rather than requiring Static Site
---

The user repeatedly confirmed: “Start Command لازم”. Their Render setup is a Web Service. Provide a usable production Start Command rather than repeatedly asking them to switch to Static Site.

**Why:** Earlier Static Site-only guidance did not match the required field in the user's actual Render form.

**How to apply:** Default this portfolio's Render instructions to Web Service with the production server. Static Site can remain an alternative, not a prerequisite. Do not deploy a Vite development or preview server as production.
