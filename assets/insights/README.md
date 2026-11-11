# Unified anonymous product insights

Dashboard: https://jimao.tylerzhang.xyz/metrics/ (same dashboard at Daily Route /metrics after main deploy).

Collection: POST https://jimao.tylerzhang.xyz/api/insights/event. Fixed products, sources, five stages and per-product action allowlists. Cross-origin requests accepted only from apex/www, temple and jimao; the origin must match the product. No cookies, identifiers or raw URLs. Public GET /api/insights/stats?days=7|14|30 returns daily aggregate rows.

Storage: new insights_v1 table in the existing jimao-metrics D1 DB. Legacy Jimao counts and Daily Route Supabase events remain separate and are not relabelled as new data. No environment secrets or additional service binding required.

Client deduplication: per product/tab in sessionStorage, 30 minutes inactivity or next UTC day resets. First source is retained in a session. One generic event per stage plus one per allowed detail, so summaries must use detail='' and not sum details into people. Completing tutorial is interaction, not game completion. Privacy opt-out uses insights:off, honors previous jimao:metrics-off and DNT/GPC on each event. Settings are independent across origins.

Source: utm_source=ai6666|share|search|direct|other|qa; unknown tag becomes other without transmitting its raw text. With no tag, classify referrer hostname locally. Promotion: ?utm_source=ai6666&utm_campaign=opc_store. Share links use utm_source=share. QA: ?utm_source=qa, excluded by default. ?analytics=off disables unified collection for that URL. Session counts are not independent real people or verified campaign clicks. Metrics failures must not display zero as a successful read.

Release: build both sites, upload jimao-insights-release.zip to jimao-tyler production first (worker + dashboard + client); upload rain-temple-insights-release.zip to rain-temple-tyler; push verified source to main for Daily Route. Preserve existing DB binding and ads.txt. ai6666 product website URLs need source tags as well.
