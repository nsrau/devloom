---
description: "DevLoom Go Flash: use DeepSeek V4 Flash for all agents"
---

# DevLoom Go Flash

Switch all agents to the cheapest DeepSeek V4 Flash model.

!`PM="$HOME/.config/opencode/commands/profile.mjs"; [ -f "$PM" ] || PM="$HOME/.config/opencode/devloom-scripts/profile.mjs"; [ -f "$PM" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }; node "$PM" set go-flash 2>&1; node "$PM" current 2>&1`

DevLoom switched to DeepSeek V4 Flash for all agents. Profile applied — restart opencode (or continue with `opencode --continue`) to see the updated profile and agents in the sidebar.
