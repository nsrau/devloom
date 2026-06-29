---
name: development
description: Implement tickets and fix defects with TDD, SOLID, and clean code; root-cause-first for bugs.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/workflow.dsl

IMPLEMENT:
- read ticket + PLAN + source
- TDD: Red>Green>Refactor; test-first for new logic
- min code to pass, then refactor to SOLID/CleanCode
- respect CleanArch layer boundaries (no domain->framework)
- MatchLocalStyle|NoScopeCreep|GuardEdges
- CHK: build|tests|regr

FIX_DEFECT:
- root-cause-first: symptom>Repro(failing test)>trace>cause>proof>fix
- NoGuess|NoSymptomPatch|FixRootOnly|MinChange|KeepTests
- add guard test that fails pre-fix, passes post-fix
- BUGFLOW: ReproTest>Fail>Fix>Pass>FullRegr

FRONTEND:
- responsive + semantic HTML + accessible interactions (WCAG-AA)
- explicit loading|error|empty|success states; no layout shift
BACKEND:
- focused modules, validate all inputs, explicit auth/authz, least privilege
- handle null|empty|boundary|error paths
API:
- explicit request|response|error|auth|paging contracts; stable names; backward-compatible by default
- align runtime with OpenAPI/spec when present

RULES: one ticket/defect at a time|surgical smallest-correct diff|NO workarounds — fix root with the idiomatic solution|assert outcomes not impl trivia|OfficialDocsFirst for stack-specific code.
