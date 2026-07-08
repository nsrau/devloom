---
name: loop-post-merge-cleanup
description: Clean up stale branches and orphaned worktrees. L1 report-only, no destructive actions.
---
LOAD: ~/.config/opencode/devloom-ai/core.dsl

FIND:
- list all worktrees from .devloom-worktrees/.registry.json
- for each branch, check if merged into main/master
- check branch age — flag >30 days as stale
- check for orphaned worktree directories (not in registry)

CLASSIFY:
- merged worktrees: safe to remove, recommend in report
- stale unmerged (>30 days): flag for human review
- orphaned directories: list paths, recommend manual cleanup
- active worktrees (clean, recently used): no action needed

REPORT:
- write to .opencode/devloom/reports/cleanup-YYYY-MM-DD.md
- include per entry: branch name, age, merge status, recommended action

OUT: .opencode/devloom/reports/cleanup-YYYY-MM-DD.md
CHK: report written | no destructive actions taken | no false positives
