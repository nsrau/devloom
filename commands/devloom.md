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
  node -e "
    const fs = require('fs');
    const os = require('os');
    const c = JSON.parse(fs.readFileSync('.opencode/devloom/config.json','utf8'));

    const PROFILES = {
      'go-premium': {
        orchestrator: 'opencode-go/glm-5.1',
        analyst: 'opencode-go/glm-5.1',
        architect: 'opencode-go/glm-5.1',
        developer: 'opencode-go/kimi-k2.6',
        qa: 'opencode-go/deepseek-v4-pro',
        documenter: 'opencode-go/glm-5.1',
        explorer: 'opencode-go/kimi-k2.6',
        'route-verifier': 'opencode-go/deepseek-v4-pro',
        'form-verifier': 'opencode-go/deepseek-v4-pro',
        'a11y-verifier': 'opencode-go/glm-5.1',
        'api-verifier': 'opencode-go/deepseek-v4-pro',
        security: 'opencode-go/deepseek-v4-pro',
        'journey-agent': 'opencode-go/glm-5.1',
        rca: 'opencode-go/deepseek-v4-pro',
        repair: 'opencode-go/kimi-k2.6',
        regression: 'opencode-go/deepseek-v4-pro',
        recovery: 'opencode-go/deepseek-v4-flash'
      },
      'go-economy': {
        orchestrator: 'opencode-go/deepseek-v4-pro',
        analyst: 'opencode-go/qwen3.6-plus',
        architect: 'opencode-go/kimi-k2.6',
        developer: 'opencode-go/kimi-k2.6',
        qa: 'opencode-go/deepseek-v4-pro',
        documenter: 'opencode-go/qwen3.6-plus',
        explorer: 'opencode-go/deepseek-v4-pro',
        'route-verifier': 'opencode-go/deepseek-v4-pro',
        'form-verifier': 'opencode-go/deepseek-v4-pro',
        'a11y-verifier': 'opencode-go/deepseek-v4-pro',
        'api-verifier': 'opencode-go/deepseek-v4-pro',
        security: 'opencode-go/deepseek-v4-pro',
        'journey-agent': 'opencode-go/deepseek-v4-pro',
        rca: 'opencode-go/deepseek-v4-pro',
        repair: 'opencode-go/kimi-k2.6',
        regression: 'opencode-go/deepseek-v4-pro',
        recovery: 'opencode-go/deepseek-v4-flash'
      },
      'go-flash': {
        orchestrator: 'opencode-go/deepseek-v4-flash',
        analyst: 'opencode-go/deepseek-v4-flash',
        architect: 'opencode-go/deepseek-v4-flash',
        developer: 'opencode-go/deepseek-v4-flash',
        qa: 'opencode-go/deepseek-v4-flash',
        documenter: 'opencode-go/deepseek-v4-flash',
        explorer: 'opencode-go/deepseek-v4-flash',
        'route-verifier': 'opencode-go/deepseek-v4-flash',
        'form-verifier': 'opencode-go/deepseek-v4-flash',
        'a11y-verifier': 'opencode-go/deepseek-v4-flash',
        'api-verifier': 'opencode-go/deepseek-v4-flash',
        security: 'opencode-go/deepseek-v4-flash',
        'journey-agent': 'opencode-go/deepseek-v4-flash',
        rca: 'opencode-go/deepseek-v4-flash',
        repair: 'opencode-go/deepseek-v4-flash',
        regression: 'opencode-go/deepseek-v4-flash',
        recovery: 'opencode-go/deepseek-v4-flash'
      },
      'free': {
        orchestrator: 'opencode/big-pickle',
        analyst: 'opencode/minimax-m3-free',
        architect: 'opencode/nemotron-3-super-free',
        developer: 'opencode/minimax-m3-free',
        qa: 'opencode/minimax-m3-free',
        documenter: 'opencode/minimax-m3-free',
        explorer: 'opencode/minimax-m3-free',
        'route-verifier': 'opencode/minimax-m3-free',
        'form-verifier': 'opencode/minimax-m3-free',
        'a11y-verifier': 'opencode/minimax-m3-free',
        'api-verifier': 'opencode/minimax-m3-free',
        security: 'opencode/minimax-m3-free',
        'journey-agent': 'opencode/minimax-m3-free',
        rca: 'opencode/minimax-m3-free',
        repair: 'opencode/minimax-m3-free',
        regression: 'opencode/minimax-m3-free',
        recovery: 'opencode/minimax-m3-free'
      }
    };

    const profile = c.profile || 'go-flash';
    const profileModels = PROFILES[profile] || PROFILES['go-flash'];
    const models = { ...profileModels, ...(c.models || {}) };

    for (const [agent, model] of Object.entries(models)) {
      let finalModel = model.trim();
      if (!finalModel.startsWith('opencode/') && !finalModel.startsWith('opencode-go/')) {
        console.warn('Warning: model ' + finalModel + ' has no prefix — auto-adding opencode/');
        finalModel = 'opencode/' + finalModel;
      }
      const f = os.homedir() + '/.config/opencode/agents/devloom-' + agent + '.md';
      try {
        let content = fs.readFileSync(f, 'utf8');
        content = content.replace(/^model:.*/m, 'model: ' + finalModel);
        fs.writeFileSync(f, content);
      } catch (e) {
        console.warn('Warning: could not update ' + f + ' — ' + e.message);
      }
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
- load memory and relevant skills before planning new work
- append every prompt as the last task/todo in `.opencode/devloom/project/tasks/TODO.md`
- auto-create or update tickets, todos, and plan entries for the prompt
- persist board+state every phase
- continue pending work first unless user reprioritizes
- one active ticket by default
- delegate specialist work to DevLoom subagents by default
- triage first: pick the minimal agent chain for the prompt intent (see workflow.dsl CHAINS); never run the full pipeline by default
- DEVLOOM_DONE only when the chosen chain's gates pass
