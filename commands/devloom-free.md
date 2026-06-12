---
description: "DevLoom Free: switch to free models only"
agent: devloom-orchestrator
model: opencode/nemotron-3-ultra-free
subtask: false
---

# DevLoom Free

Switch DevLoom to the free profile. Uses only available free models.

```bash
PROFILE_MJS="$(dirname "$(readlink -f "$0")")/profile.mjs"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/devloom-scripts/profile.mjs"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/commands/profile.mjs"
[ -f "$PROFILE_MJS" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }
node "$PROFILE_MJS" set free 2>&1
node "$PROFILE_MJS" current 2>&1
```

DevLoom switched to free models. If the current session does not pick up the new models immediately, continue with:

    opencode --continue
