---
description: "DevLoom DeepSeek: switch all agents to DeepSeek V4 Pro/Flash"
agent: devloom-orchestrator
model: opencode-go/deepseek-v4-pro
subtask: false
---

# DevLoom DeepSeek

Switch all DevLoom agents to DeepSeek V4 models: Pro for reasoning agents, Flash for verifiers and recovery.

```bash
PROFILE_MJS="$(dirname "$(readlink -f "$0")")/profile.mjs"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/devloom-scripts/profile.mjs"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/commands/profile.mjs"
[ -f "$PROFILE_MJS" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }
node "$PROFILE_MJS" set deepseek 2>&1
node "$PROFILE_MJS" current 2>&1
```

DevLoom switched to DeepSeek V4 models. If the current session does not pick up the new models immediately, continue with:

    opencode --continue
