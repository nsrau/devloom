---
name: loop-pr-babysitter
description: Watch open PRs, push stale ones forward, fix blocked CI, merge approved. L2 with verifier review.
---
LOAD: ~/.config/opencode/devloom-ai/core.dsl

ANALYZE:
- list open PRs: gh pr list --state open
- check each PR's last activity timestamp
- flag PRs idle >2 hours as candidates for action
- read PR diff and comments to understand status

ACT:
- stale PR: rebase or resolve conflicts
- blocked PR: identify blocker, ping reviewer or fix deps
- draft PR with failing CI: fix CI in linked worktree
- approved PR: merge if CI passes

SAFETY:
- max 3 attempts per PR per tick
- never force-push
- never close PRs automatically
- log all actions to run-log.json

OUT: PRs advanced or merged | run-log updated
CHK: max 3 attempts enforced | no force-push | no auto-close
