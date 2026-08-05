---
description: "DevLoom Go Economy: switch to cheaper OpenCode Go models"
---

# DevLoom Go Economy

Switch DevLoom to the OpenCode Go economy profile. Uses cheaper Go models.

!`PM="$HOME/.config/opencode/commands/profile.mjs"; [ -f "$PM" ] || PM="$HOME/.config/opencode/devloom-scripts/profile.mjs"; [ -f "$PM" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }; node "$PM" set go-economy 2>&1; node "$PM" current 2>&1`

DevLoom switched to OpenCode Go economy. Profile applied — restart opencode (or continue with `opencode --continue`) to see the updated profile and agents in the sidebar.
