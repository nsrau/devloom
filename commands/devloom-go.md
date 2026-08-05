---
description: "DevLoom Go: switch to OpenCode Go premium models"
---

# DevLoom Go

Switch DevLoom to the OpenCode Go premium profile. Uses the highest quality Go models.

!`PM="$HOME/.config/opencode/commands/profile.mjs"; [ -f "$PM" ] || PM="$HOME/.config/opencode/devloom-scripts/profile.mjs"; [ -f "$PM" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }; node "$PM" set go 2>&1; node "$PM" current 2>&1`

DevLoom switched to OpenCode Go premium. Profile applied — restart opencode (or continue with `opencode --continue`) to see the updated profile and agents in the sidebar.
