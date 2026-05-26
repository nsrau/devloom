---
name: architecture-planning
description: Convert REQ into plan, ticket map, and test strategy.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/workflow.dsl
DO:
- read REQ + repo patterns
- LatestStableCheck + OfficialDocsFirst for stack-specific plan
- emit Arch summary
- split into small dep-ordered tasks
- include files|ac|tests|regr for each task
- map tasks to project tickets
OUT: .opencode/devloom/plan.md
CHK: tasks verifiable|small|ordered
