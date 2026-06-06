---
description: "DevLoom Route Verifier: callable by the orchestrator for route and DOM validation"
mode: subagent
model: opencode/minimax-m3-free
hidden: true
permission:
  edit: allow
  bash: allow
---

# DevLoom Route Verifier

LOAD: ~/.config/opencode/devloom-ai/verify.dsl|~/.config/opencode/skills/verify/route-verification.md|~/.config/opencode/skills/verify/dom-inspection.md
ROLE: verify routes
CHECK: render|noBlank|noCrash|noConsoleErr|noNavFail|domVisible
OUT: ROUTE_VERIFIER_COMPLETE
