# DevLoom

**Autonomous Development Weaver for OpenCode**

DevLoom combines *Developer* + *Loom* — the loom being the ancient machine that
weaves individual threads into finished fabric. DevLoom does the same for software:
it takes a single natural-language prompt and weaves together requirements,
architecture, code, tests, and documentation into a complete, working feature.

---

## How It Works

The **Orchestrator** interprets your prompt, delegates to five specialist
sub-agents, and loops until every task passes QA and the final build succeeds —
no human intervention required after the initial prompt.

```
/devloom "Build a REST API for user management with JWT auth"
         │
         ▼
  DEVLOOM ORCHESTRATOR
         │
         ├── @devloom-analyst     → .opencode/devloom/requirements.md
         ├── @devloom-architect   → .opencode/devloom/plan.md
         │
         └── For each task in plan.md:
                 ├── @devloom-developer   (weaves the code)
                 ├── @devloom-qa          (inspects the weave)
                 │       └── QA_FAIL → developer re-weaves → QA re-inspects
                 └── marks task [x] on QA_PASS
         │
         ├── @devloom-documenter  (updates README + API docs)
         └── Final quality gate  (build + full test suite)
                 └── All green → DEVLOOM_DONE
```

### Agent Roster

| Agent | Mode | Role |
|---|---|---|
| `devloom-orchestrator` | `primary` | Loop controller, phase manager, quality gate |
| `devloom-analyst` | `subagent` | Prompt → `.opencode/devloom/requirements.md` |
| `devloom-architect` | `subagent` | Requirements → `.opencode/devloom/plan.md` |
| `devloom-developer` | `subagent` | Task implementation |
| `devloom-qa` | `subagent` | Tests, lint, regression checks, verdict |
| `devloom-documenter` | `subagent` | README + API doc updates |

---

## Installation

**From GitHub (recommended until published to npm):**

```bash
npm install -g https://github.com/nsrau/devloom.git
```

**From source:**

```bash
git clone https://github.com/nsrau/devloom.git
cd devloom
npm install && npm run build && node postinstall.mjs
```

**From npm (once published):**

```bash
npm install -g devloom
```

All methods run the post-install script that copies agents, commands, and skills
to your OpenCode global config directory.

**Per-project via `opencode.json`:**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["devloom"]
}
```

---

## Usage

```
/devloom Build a GraphQL API with subscriptions and Redis caching
```

Check progress mid-run:

```
/devloom-status
```

Resume an interrupted execution:

```
/devloom-resume
```

Initialize a project for DevLoom:

```
/devloom-init
```

Non-interactive / CI mode:

```bash
opencode run "/devloom Add OpenTelemetry tracing to all HTTP handlers"
```

---

## Model Configuration

By default all agents use **deepseek-v4-flash-free** (the fastest free model).

### Per-project override

Create `.opencode/devloom/config.json` in your project root. Every time you run
a DevLoom command, it reads this file and overrides the global defaults:

```json
{
  "models": {
    "orchestrator": "opencode/big-pickle",
    "analyst": "opencode/deepseek-v4-flash-free",
    "architect": "opencode/deepseek-v4-flash-free",
    "developer": "opencode/deepseek-v4-flash-free",
    "qa": "opencode/deepseek-v4-flash-free",
    "documenter": "opencode/deepseek-v4-flash-free"
  }
}
```

**All models MUST use the `opencode/` or `opencode-go/` prefix.** If you forget
the prefix, DevLoom adds it automatically and warns you.

### Interactive setup (first run)

If no `config.json` exists, Phase 0 detects available models and asks whether
to use **Free** (`opencode/`) or **Go** (`opencode-go/`) tier, then assigns
the best available model per agent role.

### Global override

Edit the agent files directly at `~/.config/opencode/agents/`:

```bash
sed -i 's|^model:.*|model: opencode/deepseek-v4-flash-free|' \
  ~/.config/opencode/agents/devloom-*.md
```

---

## Skills

Each DevLoom agent loads domain-specific skills at startup that guide its workflow:

| Agent | Skills |
|---|---|
| **analyst** | `skill-discovery`, `requirements-analysis` |
| **architect** | `skill-discovery`, `architecture-planning`, `api-design` |
| **developer** | `skill-discovery`, `incremental-development`, `test-driven-development`, `frontend-development`, `backend-development`, `api-design` |
| **qa** | `skill-discovery`, `quality-assurance`, `code-review`, `security-review`, `performance-review`, `debugging` |
| **documenter** | `skill-discovery`, `documentation` |
| **orchestrator** | `skill-discovery` |

Skills auto-detect the task type (FE, BE, security, docs, etc.) and load the
right workflow. All skills are in `skills/` and are copied to
`~/.config/opencode/skills/` during install.

---

## Persistent State

DevLoom uses `.opencode/devloom/` in your project root as shared state:

| File | Purpose |
|---|---|
| `requirements.md` | User story, functional requirements, acceptance criteria |
| `plan.md` | Ordered task checklist, updated as tasks complete |
| `config.json` | Model assignments per agent role (local override) |
| `state.json` | Execution state for resume support |
| `errors.md` | Tasks skipped after repeated failures |

All files are plain Markdown/JSON — inspect and edit them directly.

---

## Troubleshooting

### Agents not found after install
```bash
ls ~/.config/opencode/agents/ | grep devloom
```
If empty, re-run: `node $(npm root -g)/devloom/postinstall.mjs`

### ProviderModelNotFoundError
An agent file is missing the `opencode/` prefix. DevLoom auto-fixes this when
loading config.json, but if you edit agent files manually, always use the full
prefix (e.g. `opencode/deepseek-v4-flash-free`, not `deepseek-v4-flash-free`).

### The weave stops before DEVLOOM_DONE
Increase `max_steps` in `~/.config/opencode/agents/devloom-orchestrator.md` (default 200).

---

## Demo

A working example of what DevLoom produces is available in the [`demo/`](demo/) folder. It was generated from the prompt:

```
/devloom Build a very simple full-stack Task List web app.
```

The app is a full-stack Task List with an Express + SQLite backend and vanilla JS frontend, including integration tests. The original generated project is at [`../devloom-demo`](../devloom-demo).

```bash
cd demo
npm install
npm start
# Open http://localhost:3000
```

---

## License

MIT
