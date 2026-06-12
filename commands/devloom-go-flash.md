---
description: "DevLoom Go Flash: use DeepSeek V4 Flash for all agents"
agent: devloom-orchestrator
model: opencode-go/deepseek-v4-flash
subtask: false
---

# DevLoom Go Flash

Switch all agents to the cheapest DeepSeek V4 Flash model ($0.14/$0.28 per 1M tokens).

```bash
PROFILE_MJS="$(dirname "$(readlink -f "$0")")/profile.mjs"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/devloom-scripts/profile.mjs"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/commands/profile.mjs"
[ -f "$PROFILE_MJS" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }
node "$PROFILE_MJS" set go-flash 2>&1
node "$PROFILE_MJS" current 2>&1
```

DevLoom switched to DeepSeek V4 Flash for all agents. If the current session does not pick up the new models immediately, continue with:

    opencode --continue
