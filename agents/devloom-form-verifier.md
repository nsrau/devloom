---
mode: subagent
model: opencode/deepseek-v4-flash-free
hidden: true
permission:
  edit: allow
  bash: allow
---

# DevLoom Form Verifier

LOAD: ~/.config/opencode/devloom-ai/verify.dsl|~/.config/opencode/skills/verify/form-verification.md
ROLE: verify forms
CHECK: valid|invalid|required|boundary|loading|successMsg|errorMsg
OUT: FORM_VERIFIER_COMPLETE
