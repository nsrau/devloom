---
name: loop-ci-sweeper
description: Detect and fix CI failures with worktree-based changes (L2).
---
LOAD: ~/.config/opencode/devloom-ai/core.dsl

DETECT:
- check latest CI run status via gh CLI or commit status API
- parse failure output — classify as test/lint/build/typecheck
- create worktree branch for each fix

FIX:
- lint failures: auto-fix with linter, no manual changes
- test failures: inspect failing test, fix implementation (not the test)
- build failures: check for missing imports, syntax errors, config changes
- typecheck failures: fix type errors, never use `any` as workaround

VERIFY:
- run full test suite: npm test
- run typecheck: npx tsc --noEmit
- log outcome to run-log.json

OUT: fixed CI | worktree merged | run-log updated
CHK: test suite passes | typecheck clean | no new defects
