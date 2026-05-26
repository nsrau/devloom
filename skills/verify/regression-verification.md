---
name: regression-verification
description: Check impacted behavior after changes.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/workflow.dsl
DO:
- map changed files -> impacted tests/flows
- run targeted regr
- run full gate before done
