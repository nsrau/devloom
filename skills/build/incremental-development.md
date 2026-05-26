---
name: incremental-development
description: Implement one ticket in thin slices.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/workflow.dsl
DO:
- read ticket + PLAN + source
- tests first
- min code to pass
- keep queue state current
RULES: MinChange|NoScopeCreep|MatchLocalStyle|EdgeCases
CHK: build|tests|regr
