---
description: "DevLoom: show progress, active ticket, and phase"
agent: devloom-orchestrator
subtask: false
---

LOAD: `.opencode/devloom/plan.md|.opencode/devloom/errors.md|.opencode/devloom/project/board.json|.opencode/devloom/project/state.json`
REPORT:
- progress: total|done|pending|pct
- active: current ticket (in doing)
- queued: count of items in backlog (waiting behind active work)
- blocked: blocked tickets
- errors: failed/skipped work
- phase: analysis|documentation|implementation|verification|regression|queued|done
