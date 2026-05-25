---
name: regression-verification
description: After every repair, runs all verification suites — unit, integration, E2E, build, lint — to ensure previous functionality remains intact.
---

# regression-verification

## Overview
After every repair, run the full verification stack to ensure no regressions were introduced. Unit tests, integration tests, E2E tests, UI validation, accessibility validation, and API validation must all pass. Any regression is logged as a new defect.

## When to Use
- After every repair is applied
- Before marking a defect as "verified"

## Process
1. **Run unit tests**: Catch regression at the function/component level
2. **Run integration tests**: Catch regression at the module/service level
3. **Run E2E tests**: Catch regression at the user workflow level
4. **Run build**: Catch compilation errors
5. **Run lint**: Catch code quality regressions
6. **Run UI validation**: If headless browser available
7. **Run API validation**: If API verification exists

## Regression Sources
| Source | What Can Break |
|--------|----------------|
| Repair fix | The fix itself introduces a new bug |
| Changed import | Other code depending on original behavior |
| Updated state | State changes affect other components |
| Modified validation | New validation rejects previously-valid input |

## Anti-Rationalization
| Excuse | Counter |
|--------|---------|
| "It's a one-line fix, can't break anything" | One-line fixes break production regularly |
| "Tests take too long" | Skipping them causes regressions in production |
| "I only changed the backend" | API changes break frontend contracts |

## Verification
- Full test suite passes
- No regressions detected
- Defect registry updated: fixed defects marked "verified"
- New regression defects logged as "open"
