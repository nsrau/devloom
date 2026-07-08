---
id: pr-babysitter
cadence: "*/15 * * * *"
level: L2
agents: [planner, developer, qa]
cost: 200000
description: "Watch long-running PRs and push them forward"
---
# PR Babysitter Pattern

## Purpose
Watch open PRs that have been idle for >2 hours and push them forward with fixes, rebases, or reviews.

## State Schema
```json
{
  "prs": [
    {
      "number": number,
      "status": "idle" | "in_progress" | "blocked" | "merged",
      "lastActivity": "ISO string",
      "agentAssigned": string,
      "attempts": number
    }
  ]
}
```

## Agent Chain
1. planner — analyze PR diff and comments, plan next action
2. developer — implement the planned change in a worktree
3. qa — verify the change, run tests

## Safety
- L2: all changes go through verifier review before commit
- Max 3 attempts per PR per tick
- Never force-push
