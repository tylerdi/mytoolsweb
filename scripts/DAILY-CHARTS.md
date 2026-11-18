# Daily charts, v2

Effective Shanghai date: 2026-11-19. Earlier dates continue to call the original
seeded makeBoard implementation. Published daily records and replay URLs remain
valid; fixed v3 campaign progress is not migrated or reset in this release.

84 finite boards / 12 weeks, selected by Shanghai date with Monday alignment.
Mon/Tue simple, Wed/Thu standard, Fri/Sat hard, Sunday standard consolidation.
This is a banded weekly learning schedule, not a claim of increasing difficulty
every single day or a validated human skill score. Boards repeat after 84 days.

Offline random self-avoiding walks permit different boundary starts/endpoints.
The generator retains already verified catalogue entries; replacement candidates
must pass the same exact solver screen. Simple has four extra moves and at least
15 solutions; standard has two extra moves, 3–35 solutions and at least five
misleading branches; hard has no slack, 2–12 solutions, at least ten misleading
branches. The stored reference must be shortest. Every individual gate/bridge
must change the set of valid solutions when removed. Decorative gates were
removed and their charts relabelled as single-gate charts rather than called
interlocking gates. Counts are solver results, not playtest difficulty scores.

Current catalogue contains 30 return-planning, 12 current-exit, 29 gate, 12 bridge
and one verified two-gate chart. They are not claimed to be equally represented.
Beacon/current overlaps are legal: game and replay must show both symbols and a
current arrow even while the boat is on the cell.

Recheck: node scripts/build-daily-charts.mjs, npm run build:game, npm test.
Never regenerate the published catalogue in place after its effective date:
freeze it and introduce a later revision/cutover to preserve date identity.
