---
description: "DevLoom: persist current project state and pause"
agent: devloom-orchestrator
subtask: false
---

# Save

```bash
mkdir -p .opencode/devloom/project/{stories,tasks,bugs,decisions,reports}

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
  const next = {
    v: 1,
    phase: state.phase || 'paused',
    prompt: state.prompt || '',
    ticket: state.ticket || board.active || '',
    next: 'user-command',
    updatedAt: now,
    notes: Array.isArray(state.notes) ? state.notes : []
  };
  const normalizedCfg = {
    v: 1,
    lang: 'en',
    tracker: cfg.tracker === 'github' ? 'github' : 'local',
    gh: {
      enabled: !!cfg.gh?.enabled,
      owner: cfg.gh?.owner || '',
      repo: cfg.gh?.repo || '',
      project: cfg.gh?.project || ''
    },
    rules: { flow: ['analysis','documentation','implementation','verification','regression','done'], tests: 'required', regression: 'required', queue: 'single', docs: 'official', delegation: 'required', skills: 'required', memory: 'load', save: 'always', promptTask: 'append-last' }
  };
  fs.writeFileSync(p + '/config.json', JSON.stringify(normalizedCfg));
  fs.writeFileSync(p + '/board.json', JSON.stringify({
    v: 1,
    tracker: normalizedCfg.tracker,
    active: board.active || next.ticket || '',
    cols: {
      backlog: Array.isArray(board.cols?.backlog) ? board.cols.backlog : [],
      ready: Array.isArray(board.cols?.ready) ? board.cols.ready : [],
      doing: Array.isArray(board.cols?.doing) ? board.cols.doing.slice(0, 1) : (board.active ? [board.active] : []),
      review: Array.isArray(board.cols?.review) ? board.cols.review : [],
      blocked: Array.isArray(board.cols?.blocked) ? board.cols.blocked : [],
      done: Array.isArray(board.cols?.done) ? board.cols.done : []
    },
    updatedAt: now
  }));
  fs.writeFileSync(p + '/state.json', JSON.stringify(next));
  fs.writeFileSync(p + '/README.md', '# DevLoom Project Workspace\\nAll artifacts in this workspace must be written in English.\\nAI-only state files use minified JSON to reduce token usage.\\n');
"
```

MODE: Pause
LOAD: `.opencode/devloom/project/config.json|board.json|state.json`
OUT:
- state persisted
- ticket/todo/plan context preserved for the next prompt
- next=user-command
- resume with `/devloom-resume` or new `/devloom ...` prompt
