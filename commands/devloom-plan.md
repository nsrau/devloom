---
description: "DevLoom Plan: show current profile and resolved models"
agent: devloom-orchestrator
subtask: false
---

# DevLoom Plan

Show the current DevLoom profile, resolved models, overrides, and any fallbacks.

```bash
PROFILE_MJS="$(dirname "$(readlink -f "$0")")/profile.mjs"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/devloom-scripts/profile.mjs"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/commands/profile.mjs"
[ -f "$PROFILE_MJS" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }
node "$PROFILE_MJS" current 2>&1
echo ""
echo "--- Validation ---"
node "$PROFILE_MJS" validate 2>&1 || echo "Some models may be unavailable. Run /devloom-auto to re-detect."
```

Current profile shown above.
