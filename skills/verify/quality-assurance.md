---
name: quality-assurance
description: Verify AC, tests, lint, and regressions for a ticket or change.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/workflow.dsl
DO:
- read task + diff
- add missing tests (cover AC + edge cases)
- lint
- full test suite
- REGRESSION: map changed files -> impacted tests/flows, run targeted first, full gate before done
- verify all AC met
- code review: correctness|security|performance|tests|regression risk
- perf check on impacted flows: loadTime|bundleOk|noLeak|noExcessRender
- check code respects SOLID/CleanArch boundaries; flag violations + any workaround/hack as defects
OUT: QA_PASS|QA_FAIL (findings first, summary second)
