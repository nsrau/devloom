---
id: daily-triage
cadence: "0 6 * * *"
level: L1
agents: [verifier, documenter]
cost: 50000
description: "Report repo health every morning"
---
# Daily Triage Pattern

## Purpose
Generate a daily health report for the repository. Read-only (L1). Do not edit source code.

## State Schema
```json
{
  "report": {
    "date": "ISO string",
    "openPRs": number,
    "failingCI": boolean,
    "staleBranches": number,
    "unmergedWorktrees": number,
    "tokenUsage": number,
    "recommendations": string[]
  }
}
```

## Agent Chain
1. verifier (scope=explore) — check repo health, PR count, CI status, stale branches
2. documenter — write report to .opencode/devloom/reports/daily-YYYY-MM-DD.md

## Prompt Template
"Run daily triage on this repo. Check: (1) open PRs and their ages, (2) CI status from recent commits, (3) stale branches older than 7 days, (4) unmerged worktrees. Report findings. L1: do not edit any source code."

## Token Cost Estimate
~50K tokens per tick (verifier explore + documenter write).
