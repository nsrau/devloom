---
description: "DevLoom Agents: list all available agents and their current models"
agent: devloom-orchestrator
model: opencode-go/deepseek-v4-flash
subtask: false
---

# DevLoom Agents

List all DevLoom agents, their roles, and current model assignments.

```bash
PROFILE_MJS="$(node -e 'const fs=require("fs"),p=require("path");console.log(p.join(p.dirname(fs.realpathSync(process.argv[1])),"profile.mjs"))' "$0" 2>/dev/null)"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/devloom-scripts/profile.mjs"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/commands/profile.mjs"
[ -f "$PROFILE_MJS" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }
node "$PROFILE_MJS" current 2>&1
```

## Agent Reference

| Agent | Role | Description |
|-------|------|-------------|
| devloom-orchestrator | Strategic coordinator | Plans, dispatches specialists, reconciles results |
| devloom-planner | Architecture | Requirements, specs, technical plans |
| devloom-developer | Implementation | Code, features, defect fixes |
| devloom-qa | Verification | Tests, lint, code review, regression |
| devloom-verifier | Runtime checks | Routes, forms, a11y, API contracts |
| devloom-security | Security | CRUD endpoint security, data exposure |
| devloom-documenter | Documentation | README, docs, state persistence |
| devloom-vision | Visual analysis | Image/screenshot analysis |

## Usage

- `@devloom-planner` — ask for architecture or specs
- `@devloom-developer` — ask to implement or fix code
- `@devloom-qa` — ask for review or testing
- `@devloom-verifier` — ask for runtime verification
- `@devloom-security` — ask for security audit
- `@devloom-documenter` — ask for documentation
- `@devloom-vision` — attach image for analysis

Switch profiles: `/devloom-go`, `/devloom-go-economy`, `/devloom-free`

After switching profiles, restart opencode (or continue with `opencode --continue`) to see the updated profile and agents in the sidebar. If the sidebar does not reflect the current DevLoom code, run `/devloom-refresh`.
