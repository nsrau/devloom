---
description: "DevLoom: show the current weaving progress — tasks done, in progress, and any errors"
agent: devloom-orchestrator
subtask: false
---

# Setup

```bash
mkdir -p .opencode/devloom
```

# Status Report

Read `.opencode/devloom/plan.md` and `.opencode/devloom/errors.md` (if they exist) and report:

1. **Progress**: total tasks, completed ([x]), pending ([ ]), completion percentage
2. **Current task**: the first unchecked task in `.opencode/devloom/plan.md` (if any)
3. **Errors**: any failed or skipped tasks listed in `.opencode/devloom/errors.md`
4. **Phase**: which phase the weave is in (Planning / Weaving / Documenting / Done)

Format the output as a clean status report. If `.opencode/devloom/plan.md` does not exist,
report that no weaving session has been started yet.
