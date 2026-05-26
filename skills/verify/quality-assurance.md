---
name: quality-assurance
description: Verify AC, tests, lint, and regressions.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/workflow.dsl
DO:
- read task + diff
- add missing tests
- lint
- full test suite
- targeted regr first when possible
- verify all AC
OUT: QA_PASS|QA_FAIL
