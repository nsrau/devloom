---
name: test-driven-development
description: Red-Green-Refactor for new code and bug fixes.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl
CYCLE: Red>Green>Refactor
BUGFLOW: ReproTest>Fail>Fix>Pass>FullRegr
RULES:
- new logic => test first
- bug fix => failing repro first
- prefer small/medium tests; E2E for critical flows
- assert outcomes, not implementation trivia
