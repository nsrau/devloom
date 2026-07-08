---
id: ci-sweeper
cadence: "*/10 * * * *"
level: L2
agents: [developer, qa]
cost: 300000
description: "Detect and fix CI failures"
---
# CI Sweeper Pattern

## Purpose
Monitor CI pipeline results and automatically fix common failures. Operates in a worktree to contain changes.

## State Schema
```json
{
  "ci": {
    "lastRunId": string,
    "status": "passing" | "failing" | "running",
    "failureCount": number,
    "failures": [
      {
        "job": string,
        "type": "test" | "lint" | "build" | "typecheck",
        "message": string,
        "attempts": number
      }
    ]
  }
}
```

## Agent Chain
1. developer — inspect CI failure, create fix in worktree
2. qa — run tests, verify the fix doesn't break other things

## Safety
- L2: fix only in worktree, never on main branch directly
- Max 2 attempts per failure type per tick
- If fix is complex (>3 files), create a ticket instead
