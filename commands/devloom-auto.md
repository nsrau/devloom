---
description: "DevLoom Auto: detect and apply the best profile"
---

# DevLoom Auto

Detect available models and apply the best profile automatically.

!`PM="$HOME/.config/opencode/commands/profile.mjs"; [ -f "$PM" ] || PM="$HOME/.config/opencode/devloom-scripts/profile.mjs"; [ -f "$PM" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }; node "$PM" set auto 2>&1; node "$PM" current 2>&1`

DevLoom profile set automatically. Profile applied — restart opencode (or continue with `opencode --continue`) to see the updated profile and agents in the sidebar.
