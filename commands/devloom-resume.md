---
description: "Resume DevLoom from saved state"
agent: devloom-orchestrator
subtask: false
---

# Resume

```bash
mkdir -p .opencode/devloom/project/{stories,tasks,bugs,decisions,reports}
test -f .opencode/devloom/state.json || { echo "No execution state found."; exit 1; }
test -f .opencode/devloom/project/board.json || { echo "Project board missing. Run /devloom-init first."; exit 1; }
node -e "
  const fs = require('fs');
  const p = '.opencode/devloom/project';
  const readJson = (f, fb) => {
    try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fb; }
  };
  const cfg = readJson(p + '/config.json', {});
  const board = readJson(p + '/board.json', {});
  const state = readJson(p + '/state.json', {});
  const now = new Date().toISOString();
  fs.writeFileSync(p + '/README.md', '# DevLoom Project Workspace\\nAll artifacts in this workspace must be written in English.\\nAI-only state files use minified JSON to reduce token usage.\\n');
  fs.writeFileSync(p + '/config.json', JSON.stringify({ v: 1, lang: 'en', tracker: cfg.tracker === 'github' ? 'github' : 'local', gh: { enabled: !!cfg.gh?.enabled, owner: cfg.gh?.owner || '', repo: cfg.gh?.repo || '', project: cfg.gh?.project || '' }, rules: { flow: ['analysis','documentation','implementation','verification','regression','done'], tests: 'required', regression: 'required', queue: 'single', docs: 'official' } }));
  fs.writeFileSync(p + '/board.json', JSON.stringify({ v: 1, tracker: cfg.tracker === 'github' ? 'github' : 'local', active: board.active || '', cols: { backlog: Array.isArray(board.cols?.backlog) ? board.cols.backlog : [], ready: Array.isArray(board.cols?.ready) ? board.cols.ready : [], doing: Array.isArray(board.cols?.doing) ? board.cols.doing.slice(0, 1) : (board.active ? [board.active] : []), review: Array.isArray(board.cols?.review) ? board.cols.review : [], blocked: Array.isArray(board.cols?.blocked) ? board.cols.blocked : [], done: Array.isArray(board.cols?.done) ? board.cols.done : [] }, updatedAt: now }));
  fs.writeFileSync(p + '/state.json', JSON.stringify({ v: 1, phase: typeof state.phase === 'string' ? state.phase : 'idle', prompt: typeof state.prompt === 'string' ? state.prompt : '', ticket: typeof state.ticket === 'string' ? state.ticket : (board.active || ''), next: typeof state.next === 'string' ? state.next : 'analysis', updatedAt: now, notes: Array.isArray(state.notes) ? state.notes : [] }));
"
```

LOAD: `.opencode/devloom/state.json|.opencode/devloom/project/board.json|.opencode/devloom/project/state.json`
MODE: Resume
RULES:
- skip completed phases
- keep existing config/models
- normalize legacy project files before resume
- continue active/pending ticket first
