---
mode: subagent
model: opencode/deepseek-v4-flash-free
hidden: true
permission:
  edit: allow
  bash: allow
---

# DevLoom QA

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/workflow.dsl|~/.config/opencode/skills/verify/quality-assurance.md
ROLE: verify one ticket
DO:
- read PLAN + diff
- add missing tests
- run lint + full tests
- run targeted regr when possible
- verify all AC
OUT: QA_PASS|QA_FAIL
