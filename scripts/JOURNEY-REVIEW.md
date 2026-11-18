# Route journey review — 2026-11-18

Scope: select a shorter learning path from the existing 12 stable boards. No
board was silently replaced and existing v3 results retain their original level
IDs. The six selected IDs are [2,5,8,9,11,12]; the rest stay available as optional
practice in the same map picker. Selection is a design judgment, not evidence
from a user study. Scripted browser playthroughs verify the UI/solution/next-step
flow separately from solver checks. They do not establish human enjoyment.

| Original map | Decision | Why |
| --- | --- | --- |
| 1 灯塔初航 | Optional warm-up | The six-move reference is straight across the middle, and has no misleading branch. Repeating it after the eight-move onboarding delays the first planning decision. |
| 2 顺流转向 | Station 1: current exits | Two arrows and a legal right/down opening that becomes a dead end. Four spare moves permit recovery. |
| 3 岛间折返 | Optional practice | Repeats collection around an arrow before the player sees a new constraint; keep it as an alternative foundational exercise. |
| 4 第一处分岔 | Optional practice | Similar branch/return task to the selected return-planning map, with fewer meaningful budget pressures. |
| 5 航标次序 | Station 2: collection order | Targets span the upper and lower regions. Player must plan a sequence instead of approaching the nearest goal alone; two spare moves remain. |
| 6 洋流接力 | Optional practice | More arrows refine the same exit rule; increasing arrow count is not required as a compulsory next lesson. |
| 7 远岸迂回 | Optional practice | A twenty-step no-slack route is similar in length to map 8. Map 8 has a clearer, documented wrong turn and return-channel lesson. |
| 8 回程留门 | Station 3: reserve a return | Concrete legal but failing fourteenth move; corresponding interactive article explains why a distance bound is insufficient. |
| 9 信标开闸 | Station 4: prepare a gate | Introduces the first persistent state change, with open water and a dependency on beacon 2. |
| 10 双闸联锁 | Optional practice | Second gate repeats the opening dependency. Keep it optional before the bridge lesson instead of extending the compulsory sequence. |
| 11 落潮之前 | Station 5: bridge timing | Combines opening a gate with closing a bridge; taking a target is no longer uniformly beneficial. |
| 12 桥先门后 | Station 6: combine constraints | Two bridges and two gates require timing plus collection order and currents. This is a synthesis rather than another single-gate exercise. |

Onboarding uses the existing eight-move chart. Only the first four moves show
and enforce the demonstration target. At move four the target disappears and a
legal off-reference move is allowed, so a player can make a real choice and undo.
Switching away never writes tutorial completion. A selected entry preference is
stored separately; existing tutorial completion is honored for returning players.
The mode picker has three choices. Full rules/records expand on demand; a current
instruction appears when the boat enters it, and gate/bridge advice when nearby.

Telemetry: guided_complete is emitted at four moves, independent_start on the
first accepted forward move beyond four, and tutorial complete only after real
completion. All use the existing opt-out and session dedup rules, with no move
sequence, path or persistent identifier transmitted. The new dashboard row
compares these tutorial stages and starts/completions on original map 2. Map 2
also remains directly accessible, so this is a stage comparison, not proof that
all sessions passed through the tutorial or belong to the same individuals.
