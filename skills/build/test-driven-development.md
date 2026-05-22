---
name: test-driven-development
description: Write tests first (RED), implement minimum code (GREEN), refactor. Test pyramid (80/15/5).
---

# test-driven-development

## Overview
Write tests before implementation code. RED (test fails) -> GREEN (test passes) -> REFACTOR (clean up).

## When to Use
- Implementing any new logic, function, or behavior
- Fixing bugs (write test that reproduces bug first)

## Process
1. **RED**: Write a test that fails for the right reason (missing behavior, not broken test)
2. **GREEN**: Write minimum code to make the test pass
3. **REFACTOR**: Clean up while keeping tests green
4. **Verify no regressions**: Run full test suite

## Test Quality Rules
- Test one behavior per test
- DAMP over DRY in tests (readability > deduplication)
- Mock at boundaries, not internally
- Test public API, not implementation details

## Anti-Rationalization
| Excuse | Counter |
|---|---|
| "The test would be too complex" | That's a design smell -- simplify the code |
| "I can't test this without mocking everything" | Mock at the boundary, not internals |
| "I'll add tests in a follow-up" | Tests now or it doesn't exist |

## Verification
- Tests fail before implementation (RED validation)
- Tests pass after implementation (GREEN validation)
- Full suite passes without regressions
