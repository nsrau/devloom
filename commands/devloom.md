---
description: "DevLoom: autonomous delivery from one prompt"
agent: devloom-orchestrator
subtask: false
---

# Boot

```bash
mkdir -p .opencode/devloom/project/{stories,tasks,bugs,decisions,reports}

export SANITIZED_PROMPT="$(node -e "
  let p = process.argv[1] || '';
  p = p.slice(0, 4000).replace(/[\x00-\x08\x0E-\x1F\x7F]/g, '');
  process.stdout.write(p);
" -- "$ARGUMENTS")"

if [ -z "$SANITIZED_PROMPT" ] && [ -n "$ARGUMENTS" ]; then
  SANITIZED_PROMPT="$ARGUMENTS"
fi

DEVLOOM_PROMPT="$SANITIZED_PROMPT" node -e "
  const fs = require('fs');
  const p = '.opencode/devloom/project';
  const readJson = (f, fb) => {
    try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fb; }
  };
  const prompt = (process.env.DEVLOOM_PROMPT || '').trim();
  const cfg = readJson(p + '/config.json', {});
  const board = readJson(p + '/board.json', {});
  const state = readJson(p + '/state.json', {});
  const now = new Date().toISOString();
  const taskId = prompt ? 'PROMPT-' + now.replace(/[-:.TZ]/g, '').slice(0, 14) : '';
  const todoPath = p + '/tasks/TODO.md';
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
  const active = typeof board.active === 'string' ? board.active : '';
  const backlog = Array.isArray(board.cols?.backlog) ? board.cols.backlog : [];
  const nextBacklog = taskId ? [...backlog, taskId] : backlog;
  const todoHeader = '# DevLoom Prompt Tasks\nEvery /devloom prompt is appended here as the last todo before execution routing.\n\n';
  if (!fs.existsSync(todoPath)) fs.writeFileSync(todoPath, todoHeader);
  if (taskId) fs.appendFileSync(todoPath, '- [ ] ' + taskId + ' :: ' + prompt.replace(/\\s+/g, ' ') + '\n');
  const normalizedBoard = {
    v: 1,
    tracker: normalizedCfg.tracker,
    active,
    cols: {
      backlog: nextBacklog,
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
    prompt: prompt || (typeof state.prompt === 'string' ? state.prompt : ''),
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

if [ -f ".opencode/devloom/config.json" ]; then
  echo "Applying local model config..."

  PROFILE_MJS="$(dirname "$(readlink -f "$0")")/profile.mjs"
  [ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/devloom-scripts/profile.mjs"
  [ -f "$PROFILE_MJS" ] || PROFILE_MJS="$HOME/.config/opencode/commands/profile.mjs"
  [ -f "$PROFILE_MJS" ] || { echo "profile.mjs not found - reinstall DevLoom"; exit 1; }

  INIT_PROFILE="$(node -e "const c=require('./.opencode/devloom/config.json'); process.stdout.write(c.profile||'auto')" 2>/dev/null || echo auto)"

  node "$PROFILE_MJS" set "$INIT_PROFILE" 2>&1
  node "$PROFILE_MJS" apply 2>&1
fi
```

# Run

PROMPT: `$SANITIZED_PROMPT`
LOAD: `.opencode/devloom/project/config.json|.opencode/devloom/project/board.json|.opencode/devloom/project/state.json`
RULES:
- English-only artifacts
- normalize existing project files to canonical JSONM/English format before execution
- load memory and relevant skills before planning new work
- append every prompt as the last task/todo in `.opencode/devloom/project/tasks/TODO.md`
- auto-create or update tickets, todos, and plan entries for the prompt
- persist board+state every phase
- continue pending work first unless user reprioritizes
- one active ticket by default
- delegate specialist work to DevLoom subagents by default
- triage first: pick the minimal agent chain for the prompt intent (see workflow.dsl CHAINS); never run the full pipeline by default
- DEVLOOM_DONE only when the chosen chain's gates pass
