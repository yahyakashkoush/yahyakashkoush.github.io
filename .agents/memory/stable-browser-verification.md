---
name: Stable browser verification
description: Coordinate visual edits and browser verification against the shared preview
---

Complete frontend edits and the workflow restart before running a multi-step inquiry or admin verification. Do not delegate further shared-preview visual edits while that journey is running.

**Why:** A real booking check successfully handled a competing reservation, then a shared-preview hot reload reset the form just before the final send. This invalidated the last part of the verification despite the booking conflict handling working.

**How to apply:** Treat live preview edits as test interruptions. Keep temporary fixtures for a focused continuation, verify only the interrupted part again, and preserve in-progress inquiry data across reloads without automatically submitting it.
