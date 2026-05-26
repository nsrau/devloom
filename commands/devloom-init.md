---
description: "DevLoom Init: reset state and bootstrap project workspace"
agent: devloom-orchestrator
subtask: false
---

# Init

```bash
mkdir -p .opencode/devloom/project/{stories,tasks,bugs,decisions,reports}
rm -f .opencode/devloom/state.json .opencode/devloom/errors.md .opencode/devloom/requirements.md .opencode/devloom/plan.md

node -e "
  const fs = require('fs');
  const p = '.opencode/devloom/project';
  fs.writeFileSync(p + '/README.md', '# DevLoom Project Workspace\\nAll artifacts in this workspace must be written in English.\\nAI-only state files use minified JSON to reduce token usage.\\nUse local tracker by default. Use GitHub Project only with explicit user authorization.\\n');
  fs.writeFileSync(p + '/config.json', JSON.stringify({ v: 1, lang: 'en', tracker: 'local', gh: { enabled: false, owner: '', repo: '', project: '' }, rules: { flow: ['analysis','documentation','implementation','verification','regression','done'], tests: 'required', regression: 'required', queue: 'single', docs: 'official' } }));
  fs.writeFileSync(p + '/board.json', JSON.stringify({ v: 1, tracker: 'local', active: '', cols: { backlog: [], ready: [], doing: [], review: [], blocked: [], done: [] }, updatedAt: '' }));
  fs.writeFileSync(p + '/state.json', JSON.stringify({ v: 1, phase: 'idle', prompt: '', ticket: '', next: 'analysis', updatedAt: '', notes: [] }));
"
touch .opencode/devloom/project/stories/.keep .opencode/devloom/project/tasks/.keep .opencode/devloom/project/bugs/.keep .opencode/devloom/project/decisions/.keep .opencode/devloom/project/reports/.keep
```

# Run

LOAD: `.opencode/devloom/project/config.json|board.json|state.json`
FLOW: Analysis>Docs>Impl>Verify>Regr>Done
RULES: EnglishOnly|SingleActive|PersistAll|TDDReq|RegrReq
