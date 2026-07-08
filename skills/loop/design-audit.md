---
name: loop-design-audit
description: "Two-mode full audit: L1 catalogs UI/UX + functional issues (broken/missing actions, dead-ends, API mismatches); L2 fix applies unified design + functional fixes in worktrees until all verified"
---
LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/verify.dsl

AUDIT:
- enumerate: read target URL list from args, normalize each to canonical page-id
- visit each page, wait for full render

UI_CHECK:
- catalog: buttons, links, inputs, modals, forms, tables, tabs, navigation, cards, badges, icons, avatars, tooltips, progress, notifications, loading/skeleton, error, empty states
- record per-element: position, CSS (color, spacing, font, border-radius, shadow)
- note responsiveness: breakpoints, layout shifts, overflow

FUNCTIONAL_CHECK:
- test every button: click → verify expected action fires (not dead, not error)
- test every link: navigate → verify target exists (not 404, not dead-end)
- test every form: submit → verify validation + submission + success/error feedback
- test every modal: open → verify close mechanism + overlay + content
- test every table: sort/pagination/row-action → verify functional
- test every tab: switch → verify content loads + active state
- test every API call: verify endpoint exists + params correct + error handling present
- test every async action: verify loading state + success state + error state present
- catalog MISSING actions: CRUD where needed, validations absent, feedback missing
- catalog DEAD-END flows: journeys leading nowhere, missing back/return, no success/failure feedback
- catalog STATE issues: forms not resetting, stale data, race conditions, data not refreshing after mutation

CATALOG INCONSISTENCIES:
- UI: color mismatches, spacing violations, typography drift, border-radius, shadow, icon style, button variants, form field asymmetry, table styling, modal differences, nav inconsistency, hover/focus/active states
- Functional: broken actions (click does nothing), broken links (404), form validation missing, API error handling absent, loading/error/empty states missing, dead-end flows, stale state

PRODUCE SPEC:
- distill canonical UI values per component variant
- define functional contract: every action has handler, every form validates, every API has error handling, every flow has feedback
- write unified spec to .opencode/devloom/reports/design-system-spec.md
- write audit report to .opencode/devloom/reports/design-audit-YYYY-MM-DD.md
- tag each issue with category (ui|functional|missing-action|broken-action|api|state) + severity (critical|high|medium|low)

FIX:
- init: read progress from .opencode/devloom/loop/progress.json
- pick: select next item with status "pending" (ordered by severity: critical first)
- implement per item:
  - create worktree branch: devloom/design-audit/{PAGE-ID}
  - apply design system spec values to UI elements on the page
  - fix broken actions: wire up handlers, fix API calls, add error handling
  - add missing actions: implement missing CRUD, validations, feedback states
  - resolve dead-end flows: add navigation, success/failure feedback
  - fix state issues: form resets, data refresh, race condition guards
  - commit changes in worktree
- verify each item:
  - re-scan page against spec + functional contract
  - confirm: UI matches + actions work + forms validate + links resolve + API errors handled + states present
  - if failures: log, increment retry, go back to implement (max 3)
  - if pass: mark item "verified", write progress.json
- loop: if not all verified and budget remains → continue (next tick)
- stop: all verified OR budget exhausted OR max retries hit OR user pauses

CONSTRAINTS (binding):
- L1 mode: no source file edits
- L2 mode: edits only in worktrees (branch: devloom/design-audit/{page-id})
- max 3 retries per item
- each item must pass verifier before progressing
- log all outcomes to run-log.json

OUT: .opencode/devloom/reports/design-audit-YYYY-MM-DD.md | .opencode/devloom/reports/design-system-spec.md
CHK: audit produced | audit=no-source-edits | fix=all-items-verified | every-action-works | every-form-validates | every-link-resolves | every-api-has-error-handling | progress-written-to-disk
