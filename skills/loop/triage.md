---
name: loop-triage
description: Daily triage loop — check PRs, CI, branches, worktrees, budget. L1 report-only.
---
LOAD: ~/.config/opencode/devloom-ai/core.dsl

TICK:
- check open PR count and age (gh pr list / git log)
- check CI status from recent commits (git log --oneline -5)
- list stale branches older than 7 days (git branch -r)
- check unmerged worktrees (.devloom-worktrees/.registry.json)
- check token budget remaining (.opencode/devloom/loop/budget.json)

REPORT:
- write markdown to .opencode/devloom/reports/daily-YYYY-MM-DD.md
- include: summary table, recommendations, budget status

CONSTRAINTS (binding):
- no source file edits
- no test creation or modification
- no push or PR creation
- log outcome to run-log.json

OUT: .opencode/devloom/reports/daily-YYYY-MM-DD.md
CHK: report written | no source files touched | budget checked
