---
name: Supabase auth redirects
description: A silent Management API configuration mismatch that can break emailed admin setup links
---

Use the provider's actual `uri_allow_list` configuration and read it back after changing auth redirects. Do not infer success from an HTTP 200 alone.

**Why:** An update using `additional_redirect_urls` returned success but left the allowed redirect list empty. The default site URL still pointed to localhost, so administrator email links could return to the wrong site.

**How to apply:** Verify both the allowed admin callback and site URL before sending invitations or recovery links. If an invitation was already issued with bad redirect settings, correct configuration first and send a fresh recovery link rather than assuming the earlier link changed.
