---
name: simplify
description: Behavior-preserving simplification — reduce complexity for readability and maintainability without changing what the code does.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl

## When to use

After behavior is understood and tests exist. During review when code is harder to read than it needs to be. Never before correctness is proven.

## Non-negotiable invariant

**Behavior does not change.** Same inputs → same outputs, same side effects, same error behavior. If a simplification changes any observable behavior, it is a refactor with risk — flag it, do not apply silently.

## Protocol

1. **UNDERSTAND**: read the code + its tests. If no tests cover the code, write characterization tests FIRST (lock current behavior)
2. **IDENTIFY** complexity (in priority order):
   - duplication that can be extracted once
   - nesting depth > 3 (early returns, guard clauses)
   - names that hide intent (rename only, no logic change)
   - dead code (provably unreachable — delete)
   - over-abstraction (wrappers that add indirection without value — inline)
   - conditionals expressible as data/lookup tables
3. **APPLY** one simplification at a time, smallest diff possible
4. **VERIFY** after EACH change: run the tests that cover the touched code — all must pass before the next simplification
5. **STOP** when further changes would trade clarity for cleverness

## What NOT to do

- No behavior changes disguised as simplification
- No new abstractions "for future flexibility" (YAGNI)
- No reformatting-only diffs mixed with logic simplification (separate commits)
- No renaming public APIs without flagging the breaking change
- No simplifying generated code, migrations, or vendored files

## Output

```
SIMPLIFY_REPORT:
changes:
  - <file:line> <what was simplified> | risk: none|low
  - <file:line> <what> | risk: none|low
skipped:
  - <what> | reason: <why not safe to simplify>
tests: <ran> → <result>
```

RULES: tests before touching | one change at a time | verify after each | behavior-preserving or flagged | smallest diff.
