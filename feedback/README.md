# Private game feedback

POST /api/feedback stores explicit feedback in `route_feedback` in the existing
Cloudflare D1 `jimao-metrics` database, bound as FEEDBACK_DB for root Pages.
No public GET, contact collection, or automatic notification. It is separate from
`insights_v1`; the public analytics endpoint never selects this table.
The contact form displays a receipt only after the database confirms the insert.
A reused UUID prevents duplicate tickets after a timeout; changed content gets a
new UUID. Same-origin JSON only, streamed 10 KB request limit, field allowlists,
honeypot and atomic 200/day capacity limit provide basic abuse controls.

## Review loop

In Cloudflare → Storage & databases → D1 → jimao-metrics → Console:

    SELECT id, created_at, game, level, category, steps, result, device
    FROM route_feedback ORDER BY created_at DESC LIMIT 50;

Classify reports by stage (can't start / stuck / finished but repetitive),
reproduce against the stated level, then publish a factual update when fixed.
Feedback is not monitored or emailed automatically; the maintainer must review
this inbox. Do not copy raw text into the public metrics endpoint or a page.
Do not place sensitive user text in Git. No automatic retention job is enabled.

## Release checks

`npx wrangler pages dev . --port 8799` supplies local FEEDBACK_DB.
Submit a clearly labelled local test, retry the same UUID, check only one row is
stored. GET must return 405; a missing binding returns 503, never a fake success.
Production requires Pages to accept the root wrangler.toml binding and redeploy.
Before describing this as live, confirm the Pages deployment and perform one
clearly labelled release verification submission, then view the receipt in D1.
