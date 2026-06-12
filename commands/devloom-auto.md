---
description: "DevLoom Auto: detect and apply the best profile"
agent: devloom-orchestrator
subtask: false
---

# DevLoom Auto

Detect available models and apply the best profile automatically.

```bash
PROFILE_MJS="$(dirname "$(readlink -f "$0")")/profile.mjs"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/devloom-scripts/profile.mjs"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/commands/profile.mjs"
[ -f "$PROFILE_MJS" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }
node "$PROFILE_MJS" set auto 2>&1
node "$PROFILE_MJS" current 2>&1
```

DevLoom profile set automatically. If the current session does not pick up the new models immediately, continue with:

    opencode --continue
