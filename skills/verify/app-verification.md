---
name: app-verification
description: Runtime app verification across scopes — explore, route, dom, form, a11y, api, contract, journey, state.
---

LOAD: ~/.config/opencode/devloom-ai/verify.dsl
INPUT: scope = one or more of [explore|route|dom|form|a11y|api|contract|journey|state]
DO:
- start app if needed
- run only the requested scope(s); each maps to its check list in verify.dsl
- the running app is the source of truth, not specs
- hold every UI scope to UX_BAR (WCAG-AA, responsive, clear feedback, error recovery)
- report defects with route/element/expected/actual; no symptom guessing
SCOPE_MAP:
- explore->EXPLORE  route->ROUTE  dom->DOM  form->FORM  a11y->A11Y
- api->API  contract->CONTRACT  journey->JOURNEY  state->STATE
OUT: VERIFIER_COMPLETE (or defect list)
