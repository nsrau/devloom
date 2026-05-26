---
description: "DevLoom: autonomous delivery from one prompt"
agent: devloom-orchestrator
subtask: false
---

# Boot

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
    rules: { flow: ['analysis','documentation','implementation','verification','regression','done'], tests: 'required', regression: 'required', queue: 'single', docs: 'official' }
  };
  const active = typeof board.active === 'string' ? board.active : '';
  const normalizedBoard = {
    v: 1,
    tracker: normalizedCfg.tracker,
    active,
    cols: {
      backlog: Array.isArray(board.cols?.backlog) ? board.cols.backlog : [],
      ready: Array.isArray(board.cols?.ready) ? board.cols.ready : [],
      doing: Array.isArray(board.cols?.doing) ? board.cols.doing.slice(0, 1) : (active ? [active] : []),
      review: Array.isArray(board.cols?.review) ? board.cols.review : [],
      blocked: Array.isArray(board.cols?.blocked) ? board.cols.blocked : [],
      done: Array.isArray(board.cols?.done) ? board.cols.done : []
    },
    updatedAt: now
  };
  const normalizedState = {
    v: 1,
    phase: typeof state.phase === 'string' ? state.phase : 'idle',
    prompt: typeof state.prompt === 'string' ? state.prompt : '',
    ticket: typeof state.ticket === 'string' ? state.ticket : active,
    next: typeof state.next === 'string' ? state.next : 'analysis',
    updatedAt: now,
    notes: Array.isArray(state.notes) ? state.notes : []
  };
  fs.writeFileSync(p + '/README.md', '# DevLoom Project Workspace\\nAll artifacts in this workspace must be written in English.\\nAI-only state files use minified JSON to reduce token usage.\\n');
  fs.writeFileSync(p + '/config.json', JSON.stringify(normalizedCfg));
  fs.writeFileSync(p + '/board.json', JSON.stringify(normalizedBoard));
  fs.writeFileSync(p + '/state.json', JSON.stringify(normalizedState));
"

export SANITIZED_PROMPT="$(node -e "
  let p = process.argv[1] || '';
  p = p.slice(0, 4000).replace(/[\x00-\x08\x0E-\x1F\x7F]/g, '');
  process.stdout.write(p);
" -- "$ARGUMENTS")"

if [ -z "$SANITIZED_PROMPT" ] && [ -n "$ARGUMENTS" ]; then
  SANITIZED_PROMPT="$ARGUMENTS"
fi

if [ -f ".opencode/devloom/config.json" ]; then
  echo "Applying local model config..."
  node -e "
    const c = JSON.parse(require('fs').readFileSync('.opencode/devloom/config.json','utf8'));
    for (const [agent, model] of Object.entries(c.models || {})) {
      let finalModel = model.trim();
      if (!finalModel.startsWith('opencode/') && !finalModel.startsWith('opencode-go/')) finalModel = 'opencode/' + finalModel;
      const f = require('os').homedir() + '/.config/opencode/agents/devloom-' + agent + '.md';
      try {
        const fs = require('fs');
        let content = fs.readFileSync(f, 'utf8');
        content = content.replace(/^model:.*/m, 'model: ' + finalModel);
        fs.writeFileSync(f, content);
      } catch {}
    }
  "
fi
```

# Run

PROMPT: `$SANITIZED_PROMPT`
LOAD: `.opencode/devloom/project/config.json|.opencode/devloom/project/board.json|.opencode/devloom/project/state.json`
RULES:
- English-only artifacts
- normalize existing project files to canonical JSONM/English format before execution
- persist board+state every phase
- continue pending work first unless user reprioritizes
- one active ticket by default
- full flow: Analysis>Docs>Impl>Verify>Regr>Done
- DEVLOOM_DONE only when all gates pass
