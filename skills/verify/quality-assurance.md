---
name: quality-assurance
description: Runs tests, linting, verifies acceptance criteria, and reports PASS/FAIL.
---

# quality-assurance

## Overview
Verify that a completed task meets its acceptance criteria: run tests, check linting, verify edge cases, and produce a clear PASS or FAIL verdict.

## When to Use
- A task has been marked as implemented by the developer
- You need to verify code quality and correctness

## Process
1. **Read task spec**: Check `.opencode/devloom/plan.md` for acceptance criteria
2. **Read modified files**: Understand what changed
3. **Write missing tests**: Unit + integration for new code
4. **Run linter**: `npm run lint` or `npx eslint`
5. **Run test suite**: `npm test` or framework equivalent
6. **Verify each AC**: Every criterion from the plan must be met
7. **Report**: `QA_PASS` or `QA_FAIL` with specific details

## QA Checklist
- [ ] Tests exist for all new code
- [ ] Edge cases covered (null, empty, boundary, error)
- [ ] Linter passes
- [ ] Full test suite passes
- [ ] No regressions in existing tests
- [ ] Acceptance criteria all verified

## Anti-Rationalization
| Excuse | Counter |
|---|---|
| "The code compiles, it's fine" | Compilation != correctness |
| "These tests are enough" | Do they cover edge cases and error paths? |
| "QA takes too long, skip it" | Bugs in production cost 100x more |

## Verification
- Verdict is either `QA_PASS` or `QA_FAIL`
- Failure reports include specific files, lines, and error messages
- Success reports list which criteria were verified
