---
description: "DevLoom Free: switch to free models only"
---

# DevLoom Free

Switch DevLoom to the free profile. Uses only available free models.

!`PM="$HOME/.config/opencode/commands/profile.mjs"; [ -f "$PM" ] || PM="$HOME/.config/opencode/devloom-scripts/profile.mjs"; [ -f "$PM" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }; node "$PM" set free 2>&1; node "$PM" current 2>&1`

DevLoom switched to free models. Profile applied — restart opencode (or continue with `opencode --continue`) to see the updated profile and agents in the sidebar.
