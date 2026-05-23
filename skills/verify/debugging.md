---
name: debugging
description: "Five-step triage: reproduce, localize, reduce, fix, guard. Stop-the-line rule."
---

# debugging

## Overview
Systematic five-step debugging process. Reproduce the issue, localize the root cause, reduce to minimum repro, fix, then guard against regression.

## When to Use
- Tests fail
- Build breaks
- Behavior is unexpected
- Bug report received

## Process
1. **REPRODUCE**: Get a consistent, minimal reproduction
2. **LOCALIZE**: Find the exact file and line where the bug originates
3. **REDUCE**: Simplify to the minimum code that triggers the bug
4. **FIX**: Apply the minimal correction
5. **GUARD**: Write a test that would catch this regression

## Debugging Tactics
- Binary search: Comment out half the code, see if bug persists
- Print/log: Add logging at each step to narrow location
- Unit test: Write a focused test for the failing case
- Diff: Compare with known-good version

## Anti-Rationalization
| Excuse | Counter |
|---|---|
| "I know what the fix is" | Reproduce first -- assumptions are often wrong |
| "The error message is misleading" | The error tells you something -- read it carefully |
| "I can't reproduce it" | Then you can't fix it -- keep trying |

## Verification
- Bug is fixed (test passes)
- Regression test added
- No new bugs introduced
