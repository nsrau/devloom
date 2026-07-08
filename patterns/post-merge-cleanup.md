---
id: post-merge-cleanup
cadence: "0 3 * * *"
level: L1
agents: [developer, qa]
cost: 40000
description: "Clean up stale branches and worktrees"
---
# Post-Merge Cleanup Pattern

## Purpose
Clean up stale branches and worktrees that have already been merged or are no longer needed. L1: reports only, no destructive actions without confirmation.

## State Schema
```json
{
  "cleanup": {
    "checked": "ISO string",
    "staleBranches": number,
    "mergedWorktrees": number,
    "orphanedWorktrees": number,
    "recommendedActions": string[]
  }
}
```

## Agent Chain
1. developer — list all worktrees, check merge status of each branch
2. qa — verify branches are safe to remove, report findings

## Safety
- L1: report-only, no automatic deletion
- Flag branches merged >7 days ago as cleanup candidates
- Never delete unmerged branches
