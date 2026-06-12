---
description: "DevLoom Go Economy: switch to cheaper OpenCode Go models"
agent: devloom-orchestrator
model: opencode-go/deepseek-v4-pro
subtask: false
---

# DevLoom Go Economy

Switch DevLoom to the OpenCode Go economy profile. Uses cheaper Go models.

```bash
PROFILE_MJS="$(dirname "$(readlink -f "$0")")/profile.mjs"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/devloom-scripts/profile.mjs"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/commands/profile.mjs"
[ -f "$PROFILE_MJS" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }
node "$PROFILE_MJS" set go-economy 2>&1
node "$PROFILE_MJS" current 2>&1
```

DevLoom switched to OpenCode Go economy. If the current session does not pick up the new models immediately, continue with:

    opencode --continue
