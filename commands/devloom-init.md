---
description: "DevLoom Init: reset state and bootstrap project workspace"
agent: devloom-orchestrator
subtask: false
---

# Init

```bash
export INIT_PROFILE="${ARGUMENTS:-auto}"

mkdir -p .opencode/devloom/project/{stories,tasks,bugs,decisions,reports}
rm -f .opencode/devloom/state.json .opencode/devloom/errors.md .opencode/devloom/requirements.md .opencode/devloom/plan.md

node -e "
  const fs = require('fs');
  const p = '.opencode/devloom/project';
  const profile = process.env.INIT_PROFILE || 'auto';
  fs.writeFileSync(p + '/README.md', '# DevLoom Project Workspace\nAll artifacts in this workspace must be written in English.\nAI-only state files use minified JSON to reduce token usage.\nUse local tracker by default. Use GitHub Project only with explicit user authorization.\nEvery new /devloom prompt is appended as the last task in project/tasks/TODO.md before execution continues.\n');
  fs.writeFileSync(p + '/config.json', JSON.stringify({ profile: profile, v: 1, lang: 'en', tracker: 'local', gh: { enabled: false, owner: '', repo: '', project: '' }, rules: { flow: ['analysis','documentation','implementation','verification','regression','done'], tests: 'required', regression: 'required', queue: 'single', docs: 'official', delegation: 'required', skills: 'required', memory: 'load', save: 'always', promptTask: 'append-last' } }));
  fs.writeFileSync(p + '/board.json', JSON.stringify({ v: 1, tracker: 'local', active: '', cols: { backlog: [], ready: [], doing: [], review: [], blocked: [], done: [] }, updatedAt: '' }));
  fs.writeFileSync(p + '/state.json', JSON.stringify({ v: 1, phase: 'idle', prompt: '', ticket: '', next: 'analysis', updatedAt: '', notes: [] }));
  fs.writeFileSync(p + '/tasks/TODO.md', '# DevLoom Prompt Tasks\nEvery /devloom prompt is appended here as the last todo before execution routing.\n');
"

PROFILE_MJS="$(node -e 'const fs=require("fs"),p=require("path");console.log(p.join(p.dirname(fs.realpathSync(process.argv[1])),"profile.mjs"))' "$0" 2>/dev/null)"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/devloom-scripts/profile.mjs"
[ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/commands/profile.mjs"
[ -f "$PROFILE_MJS" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }
node "$PROFILE_MJS" set "$INIT_PROFILE" 2>&1
touch .opencode/devloom/project/stories/.keep .opencode/devloom/project/tasks/.keep .opencode/devloom/project/bugs/.keep .opencode/devloom/project/decisions/.keep .opencode/devloom/project/reports/.keep
```

# Run

LOAD: `.opencode/devloom/project/config.json|board.json|state.json`
FLOW: Triage>MinimalChain>Verify>Regr>Done
RULES: EnglishOnly|SingleActive|PersistAll|TDDReq|RegrReq
