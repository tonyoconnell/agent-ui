---
name: you
uid: one:you
role: chairman
model: human
channels:
  - chat
  - telegram
  - email
group: ONE
board: true
sensitivity: 0.5
wallet: derived-on-first-signin
permissions:
  - appoint_ceo
  - hire_director
  - fire_director
  - set_sensitivity
  - set_escape_threshold
  - set_fade_rate
  - receive_frontier_signals
  - receive_escape_alerts
skills:
  - name: decide
    price: 0.10
    tags: [governance, decision, chairman]
  - name: approve
    price: 0.05
    tags: [governance, approval, budget]
  - name: set-policy
    price: 0.05
    tags: [governance, policy, sensitivity]
---

You are the chairman of ONE. You sit on the board. You are human.

## Your seat

You're the top of the graph for this world. The CEO reports to you. The
board — of which you are a member — audits the whole system. You do not
execute work; you set direction and approve.

## What you actually do

- **Decide.** One decision per reply. No hedging, no maybe.
- **Approve.** Directors and CEO bring proposals; you say yes / no / revise
  with a reason. "Revise" includes the specific change.
- **Set policy.** Sensitivity (explore vs exploit), fade rate (how fast
  failure is forgiven), escape thresholds (when to stop a plan).
- **Receive frontier signals.** When a tag cluster has no director owner,
  the CEO escalates to you — you decide whether to hire.
- **Receive escape alerts.** When a plan crosses its escape condition,
  you get the signal immediately (not batched).

## What you never do

- Execute tasks yourself (that's what agents are for)
- Name the agent that should handle work (tags + pheromone route it)
- Plan in calendar time (always cycles)
- Override the substrate's marks/warns (let it learn)
- Skip the CEO (undermines the hierarchy)

## Your daily signal

Every day at 9am, the `todo.md` dashboard lands in your inbox as a digest:

```
PLANS: 3 active (1 near escape), 2 new proposals from CEO
RUBRIC: 7d avg 0.82 (↑ 0.04 from last week)
PHEROMONE: top tag-paths: substrate→routing (strength 82), marketing→chat (47)
REVENUE: $14.20 / 7d (+$3.10 from 4 new capabilities live)
FRONTIER: 2 tag clusters with no director coverage → CEO proposes hires
ESCAPE: plan `marketing-flywheel` at rubric 0.48 for 2 cycles → action required
NEXT: 1 chairman-level decision pending (approve CSO hire from CEO)
```

Your reply closes the loop — mark what continues, warn what drifts,
dissolve what no longer serves.

## Weekly ritual

End of week: one signal to CEO with one page of feedback. What's working,
what's not, what to stop. The CEO routes it through the directors.

## The philosophy

The substrate measures your decisions. When your `approve` calls lead to
successful outcomes, the path from you → CEO → director strengthens. When
your approvals lead to failure, `warn()` fires on that path. Over time,
the team learns which kinds of decisions to bring to you vs. handle
themselves. Delegation gets delegated — without losing accountability.

## See also

- `agents/ceo.md` — your one direct report
- `one/lifecycle-one.md § Stage 3` — how the chairman-CEO-directors chain forms
- `one/governance-todo.md` — the permission = role × pheromone model
- `todo.md` — the operational dashboard you read every morning
