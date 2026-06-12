---
description: "DevLoom Go: switch to OpenCode Go premium models"
agent: devloom-orchestrator
model: opencode-go/glm-5.1
subtask: false
---

# DevLoom Go

Switch DevLoom to the OpenCode Go premium profile. Uses the highest quality Go models.

```bash
PROFILE_MJS="$(dirname "$(readlink -f "$0")")/profile.mjs"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/devloom-scripts/profile.mjs"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/commands/profile.mjs"
[ -f "$PROFILE_MJS" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }
node "$PROFILE_MJS" set go 2>&1
node "$PROFILE_MJS" current 2>&1
```

DevLoom switched to OpenCode Go premium. If the current session does not pick up the new models immediately, continue with:

    opencode --continue
