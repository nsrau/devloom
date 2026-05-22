---
name: incremental-development
description: Implements code in thin vertical slices with test-first approach.
---

# incremental-development

## Overview
Implement features in small, verifiable increments. Each slice is a complete vertical slice through all layers, not a horizontal layer.

## When to Use
- You have a task from the plan to implement
- Any code writing

## Process
1. **Read task spec** from `.opencode/devloom/plan.md`
2. **Read relevant source files**: Understand naming, imports, patterns, error handling
3. **Write tests first** (if not provided): Unit tests for new functions, integration for endpoints
4. **Implement**: Minimum code to pass tests
5. **Verify**: Run tests, check no regressions
6. **Report**: DEVELOPER_COMPLETE with modified files

## Code Quality Rules
- Match existing code style exactly
- Handle errors and edge cases (null, empty, boundary values)
- Do NOT refactor unrelated code
- No new dependencies without explicit AC

## Anti-Rationalization
| Excuse | Counter |
|---|---|
| "I'll add tests after implementing" | Tests before code -- RED before GREEN |
| "This edge case won't happen" | If it won't happen, handling it costs nothing |
| "I'll refactor this too while I'm here" | One change at a time -- scope creep causes bugs |

## Verification
- Implementation passes existing tests
- New code matches project style
- All acceptance criteria met
