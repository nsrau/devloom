---
description: "DevLoom Plan: show current profile and resolved models"
---

# DevLoom Plan

Show the current DevLoom profile, resolved models, overrides, and any fallbacks.

!`PM="$HOME/.config/opencode/commands/profile.mjs"; [ -f "$PM" ] || PM="$HOME/.config/opencode/devloom-scripts/profile.mjs"; [ -f "$PM" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }; node "$PM" current 2>&1; echo ""; echo "--- Validation ---"; node "$PM" validate 2>&1 || echo "Some models may be unavailable. Run /devloom-auto to re-detect."`

Current profile shown above.

Profile applied — restart opencode (or continue with `opencode --continue`) to see the updated profile and agents in the sidebar.
