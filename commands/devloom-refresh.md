---
description: "DevLoom Refresh: reinstall global assets and refresh the OpenCode plugin cache"
---

# DevLoom Refresh

Re-syncs DevLoom's installed agents/commands/skills and refreshes the OpenCode
plugin cache so the current profile and all DevLoom agents show correctly in the
OpenCode sidebar. The refresh **rebuilds dist/ from source first** (`npm run
build`, best-effort), so the cache always receives freshly compiled plugin code —
never a stale build.

Run this after updating DevLoom (`npm install -g devloom`) or whenever the
sidebar does not reflect the profile you switched to.

!`DEVLOOM_ROOT="$(npm root -g 2>/dev/null)/devloom"; if [ ! -d "$DEVLOOM_ROOT" ]; then echo "DevLoom global package not found. Install it first: npm install -g devloom"; exit 1; fi; node "$DEVLOOM_ROOT/postinstall.mjs" 2>&1; PM="$HOME/.config/opencode/commands/profile.mjs"; [ -f "$PM" ] || PM="$HOME/.config/opencode/devloom-scripts/profile.mjs"; [ -f "$PM" ] || PM="$HOME/.config/opencode/commands/profile.mjs"; [ -f "$PM" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }; node "$PM" apply 2>&1`

DevLoom assets are re-synced and the OpenCode plugin cache now contains the
current plugin code (the config hook that surfaces the profile and agents).

Restart opencode (or continue with `opencode --continue`) to see the updated
profile and agents in the sidebar.
