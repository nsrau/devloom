---
name: verification-planning
description: Plan a project-specific evidence path before non-trivial changes — what proof will demonstrate the change works.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl

## When to use

Before implementing any non-trivial change (feature, refactor, cross-system change, bug with unclear reproduction). Skip for trivial one-line fixes.

## Protocol

1. **OBSERVABLE OUTCOME**: define what the user can observe when the change works (not "code is clean" — "POST /users returns 201 with the created record")
2. **EVIDENCE PATH**: pick the minimum checks that prove the outcome, ordered narrow → broad:
   - unit test on new logic
   - integration test on the touched flow
   - lint/typecheck on changed packages
   - full suite only when integration scope justifies it
   - runtime check (route/form/api/journey) when user-facing
3. **RISK MAP**: what breaks if this change is wrong? List the top 3 adjacent behaviors that must keep working (regression targets)
4. **GATE DEFINITION**: for each check, define pass criteria explicitly ("X tests green", "route returns 200 with shape Y")
5. **ESCALATION RULE**: when a focused check fails in an unexpected way, widen scope one level — never jump straight to full-project verification

## Output

```
EVIDENCE_PLAN:
outcome: <observable result>
checks:
  - [unit] <what> | gate: <pass criteria>
  - [integration] <what> | gate: <pass criteria>
  - [runtime] <scope> | gate: <pass criteria>   (only if user-facing)
regression_targets:
  - <adjacent behavior 1>
  - <adjacent behavior 2>
  - <adjacent behavior 3>
```

RULES: evidence > intuition | minimum viable proof first | every check has explicit pass criteria | runtime truth beats spec assumptions.
