---
name: code-review
description: Systematic code review with severity classification. Staff engineer standard.
---

# code-review

## Overview
Review code against five axes: correctness, maintainability, security, performance, and testability. Classify each finding by severity.

## When to Use
- Reviewing a pull request or completed implementation
- auditing code quality before merge

## Review Axes
1. **Correctness**: Does the code do what it should? Edge cases handled?
2. **Maintainability**: Clear naming? Appropriate abstraction? Comments explain why?
3. **Security**: Input validation? Auth checks? Data exposure?
4. **Performance**: N+1 queries? Unnecessary allocations? Bundle size?
5. **Testability**: Are there tests? Do they test behavior or implementation?

## Severity Classification
| Severity | Meaning | Action |
|---|---|---|
| BLOCKER | Bug, security hole, data loss | Must fix before merge |
| HIGH | Logic error, missing validation | Should fix before merge |
| MEDIUM | Code smell, unclear naming | Fix if time allows |
| LOW | Style nit, minor suggestion | Optional |

## Process
1. Read modified files
2. Assess each file against the 5 axes
3. Find up to 10 issues, prioritize by severity
4. Report findings with file:line references

## Verification
- Each issue has severity, location, and suggestion
- Blocker and High issues are addressed before pass
