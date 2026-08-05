---
description: "DevLoom DeepSeek: switch all agents to DeepSeek V4 Pro/Flash"
---

# DevLoom DeepSeek

Switch all DevLoom agents to DeepSeek V4 models: Pro for reasoning agents, Flash for verifiers and recovery.

!`PM="$HOME/.config/opencode/commands/profile.mjs"; [ -f "$PM" ] || PM="$HOME/.config/opencode/devloom-scripts/profile.mjs"; [ -f "$PM" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }; node "$PM" set deepseek 2>&1; node "$PM" current 2>&1`

DevLoom switched to DeepSeek V4 models. Profile applied — restart opencode (or continue with `opencode --continue`) to see the updated profile and agents in the sidebar.
