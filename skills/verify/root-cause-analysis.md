---
name: root-cause-analysis
description: Systematic reproduction, localization, and root cause determination. Never fixes symptoms — always finds the root cause.
---

# root-cause-analysis

## Overview
Five-step RCA process: reproduce, localize, reduce, determine root cause, generate repair strategy. Never fix symptoms. Every repair must target the root cause.

## When to Use
- A defect has been discovered by any verification agent
- A test is failing consistently
- A gate condition is not met

## Process
1. **REPRODUCE**: Get a consistent, minimal reproduction of the defect
2. **LOCALIZE**: Find the exact file, function, and line where the bug originates
3. **REDUCE**: Simplify to the minimum code that triggers the bug
4. **DETERMINE ROOT CAUSE**: Categorize the root cause (logic, validation, state, timing, config, dependency, edge case, type, contract, regression)
5. **GENERATE REPAIR STRATEGY**: Concrete, actionable fix with specific files and lines

## Root Cause Categories
| Category | Indicators |
|----------|------------|
| Logic error | Wrong operator, wrong comparison, missing early return |
| Missing validation | Null/undefined errors, unvalidated input reaches consumer |
| State management | Stale state, wrong state enum, state not persisted |
| Race condition | Async without await, promise not handled |
| Configuration | Wrong env variable, missing config, wrong constant |
| Edge case | Empty array, null field, undefined property, boundary value |
| Type error | Missing type guard, wrong type assertion |
| Contract mismatch | API returns different shape than client expects |

## Anti-Rationalization
| Excuse | Counter |
|--------|---------|
| "I know what the fix is" | Reproduce first — assumptions are often wrong |
| "The error message is misleading" | The error tells you something — read it carefully |
| "I can't reproduce it" | Then you can't fix it — keep trying |

## Verification
- Root cause is identified (not just the symptom)
- Repair strategy is concrete and actionable
- Defect registry updated with root cause
