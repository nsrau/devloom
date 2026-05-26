---
name: code-review
description: Review for correctness, risk, tests, and regressions.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/verify.dsl
CHECK:
- correctness
- security
- performance
- tests
- regression risk
OUT: findings first; summary second
