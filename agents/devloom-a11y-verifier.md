---
mode: subagent
model: opencode/deepseek-v4-flash-free
hidden: true
permission:
  edit: allow
  bash: allow
---

# DevLoom A11y Verifier

LOAD: ~/.config/opencode/devloom-ai/verify.dsl|~/.config/opencode/skills/verify/accessibility-verification.md
ROLE: verify accessibility
CHECK: role|label|focus|kbNav|escClose|contrast|semanticHtml
OUT: A11Y_VERIFIER_COMPLETE
