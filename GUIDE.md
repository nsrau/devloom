# DevLoom — Installation & Usage Guide

DevLoom is the Autonomous Development Weaver for OpenCode. This guide covers
everything from first install to advanced usage and troubleshooting.

---

## Prerequisites

| Requirement | Minimum version | Check command |
|---|---|---|
| [OpenCode](https://opencode.ai) | latest | `opencode --version` |
| Node.js | 18.x | `node --version` |
| npm | 9.x | `npm --version` |

---

## Installation

### Option A — npm global install (recommended)

```bash
npm install -g devloom
```

The `postinstall` script runs automatically and copies all agent, command,
and skill files to your OpenCode global config directory:

| OS | Config directory |
|---|---|
| Linux | `~/.config/opencode/` |
| macOS | `~/Library/Application Support/opencode/` |
| Windows | `%APPDATA%\opencode\` |

Expected output:

```
DevLoom — post-install

  Config dir  : /home/you/.config/opencode
  Agents dir  : /home/you/.config/opencode/agents
  Commands dir: /home/you/.config/opencode/commands

Installing agents:
  - Agent: devloom-orchestrator
  - Agent: devloom-analyst
  - Agent: devloom-architect
  - Agent: devloom-developer
  - Agent: devloom-qa
  - Agent: devloom-documenter

Installing commands:
  - Command: /devloom
  - Command: /devloom-status
  - Command: /devloom-resume
  - Command: /devloom-init

DevLoom installed successfully!
```

---

### Option B — Install from source

```bash
git clone https://github.com/nsrau/devloom.git
cd devloom

# Install dev dependencies and compile TypeScript
npm install
npm run build

# Run the installer manually
node postinstall.mjs
```

---

### Option C — Per-project only

Add DevLoom to your project's `opencode.json` to keep it scoped to that
project without a global install:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["devloom"]
}
```

OpenCode loads it automatically when you open a session in that directory.

---

## Verifying the Installation

Start OpenCode and open the command palette by typing `/`:

```
/devloom          → Weave a full feature from a single prompt
/devloom-status   → Show current weaving progress
/devloom-resume   → Resume an interrupted execution
/devloom-init     → Initialize a project for DevLoom
```

Or check installed files directly:

```bash
# Linux / macOS
ls ~/.config/opencode/agents/ | grep devloom

# Expected:
devloom-analyst.md
devloom-architect.md
devloom-developer.md
devloom-documenter.md
devloom-orchestrator.md
devloom-qa.md
```

---

## Configuring Models

### Default (no config)

All agents default to `opencode/deepseek-v4-flash-free` — the fastest free model.

### Per-project override (recommended)

Create `.opencode/devloom/config.json` in your project root:

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

Every DevLoom command (`/devloom`, `/devloom-init`, `/devloom-resume`) reads
this file before invoking the orchestrator and applies the models to the
global agent files. **Local config always wins.**

### Prefix requirement

All models MUST use the `opencode/` or `opencode-go/` prefix:

| Correct | Wrong |
|---|---|
| `opencode/deepseek-v4-flash-free` | `deepseek-v4-flash-free` |
| `opencode-go/deepseek-v4-pro` | `deepseek-v4-pro` |

If you forget the prefix, DevLoom adds it automatically and logs a warning.

### First-run interactive setup

If no `config.json` exists, Phase 0 detects available models (`opencode models`),
asks whether to use **Free** (`opencode/`) or **Go** (`opencode-go/`) tier,
then assigns the best available model per agent role.

### Available models

**Free tier** (`opencode/` — zero cost):

| Model string |
|---|
| `opencode/deepseek-v4-flash-free` |
| `opencode/minimax-m2.5-free` |
| `opencode/nemotron-3-super-free` |
| `opencode/big-pickle` |

**Go tier** (`opencode-go/` — higher quality):

| Model string |
|---|
| `opencode-go/deepseek-v4-pro` |
| `opencode-go/deepseek-v4-flash` |
| `opencode-go/kimi-k2.5` |
| `opencode-go/kimi-k2.6` |
| `opencode-go/glm-5` |
| `opencode-go/glm-5.1` |
| `opencode-go/minimax-m2.5` |
| `opencode-go/minimax-m2.7` |
| `opencode-go/mimo-v2.5` |
| `opencode-go/mimo-v2.5-pro` |
| `opencode-go/qwen3.5-plus` |
| `opencode-go/qwen3.6-plus` |

Run `opencode models` to see what's currently available in your environment.

### Global override (advanced)

Edit the agent files at `~/.config/opencode/agents/` directly:

```bash
sed -i 's|^model:.*|model: opencode/deepseek-v4-flash-free|' \
  ~/.config/opencode/agents/devloom-*.md
```

---

## Usage

### Start a weaving session

Navigate to your project directory, then open OpenCode:

```bash
cd /path/to/your/project
opencode
```

#### Option 1 — Slash command (recommended)

```
/devloom Build a REST API for user management with JWT authentication and role-based access control
```

#### Option 2 — Direct agent invocation

```
@devloom-orchestrator Build a REST API for user management with JWT authentication
```

#### Option 3 — Non-interactive / CI mode

```bash
opencode run "/devloom Add OpenTelemetry tracing to all HTTP handlers"
```

---

### What happens after you submit the prompt

DevLoom works through phases automatically:

**Phase 0 — Model Setup**

If `.opencode/devloom/config.json` exists, its models are loaded and applied
immediately. Otherwise the orchestrator detects available models, asks your
preference (Free or Go tier), and assigns models per agent role.

**Phase 1 — Understand & Plan**

The Analyst explores your codebase and writes `.opencode/devloom/requirements.md`.
The Architect reads the requirements and writes `.opencode/devloom/plan.md`
with an ordered, dependency-resolved task list.

**Phase 2 — Weave**

For each task in the plan:
1. The Developer implements the code.
2. QA writes tests, runs the linter, runs the full test suite, and reports
   `QA_PASS` or `QA_FAIL`.
3. On failure: the Orchestrator passes the exact failure details back to the
   Developer for targeted fixes, then QA re-runs. This repeats until the
   task passes (max 3 attempts, then skipped).
4. The Orchestrator marks the task `[x]` in `.opencode/devloom/plan.md`.

**Phase 3 — Finish & Deliver**

The Documenter updates `README.md` and any API docs.
The Orchestrator runs the final build + test gate.
When everything is green, you see:

```
DEVLOOM_DONE

Completed 8 tasks:
  - Task 1: Database schema and migration
  - Task 2: User model and repository layer
  - Task 3: JWT token service
  - Task 4: Auth middleware
  - Task 5: User CRUD endpoints
  - Task 6: Role-based access control
  - Task 7: Unit and integration tests
  - Task 8: API documentation
```

---

### Monitor progress mid-run

At any point, open a second OpenCode session and run:

```
/devloom-status
```

Example output:

```
DevLoom Weaving Status
----------------------
Phase      : Weaving (task 3 of 8)
Progress   : 25%  (2 / 8 tasks complete)
In progress: Task 3 — JWT token service
Errors     : None

Completed
  - Task 1: Database schema
  - Task 2: User model

Pending
  - Task 3: JWT service  <- in progress
  - Task 4: Auth middleware
  - Task 5: User CRUD endpoints
  ...
```

You can also inspect the state files directly:

```bash
cat .opencode/devloom/plan.md            # full task list with checkboxes
cat .opencode/devloom/requirements.md    # generated requirements
cat .opencode/devloom/config.json        # model assignments
cat .opencode/devloom/state.json         # execution state
cat .opencode/devloom/errors.md          # any tasks skipped due to repeated failure
```

---

### Resume an interrupted execution

If the weave stops (model timeout, network issue, manual interrupt), you
can resume from where it left off:

```
/devloom-resume
```

The orchestrator reads `.opencode/devloom/state.json`, skips completed phases,
and continues from the last pending task.

---

### Initialize a project

To set up the `.opencode/devloom/` directory structure and initial config
without starting a weave:

```
/devloom-init
```

---

## Skills System

Each agent loads domain-specific skills at session start. The `skill-discovery`
meta-skill scans the task prompt and auto-loads the right skill (FE, BE, QA,
security, docs, etc.).

```yaml
# Each agent declares its skills in YAML frontmatter:
skill:
  - skill-discovery
  - frontend-development
```

Skills are stored in `~/.config/opencode/skills/` following the
[agent-skills](https://github.com/addyosmani/agent-skills) convention:

```
skills/
├── meta/       skill-discovery
├── define/     requirements-analysis
├── plan/       architecture-planning
├── build/      frontend-development, backend-development, api-design,
│               incremental-development, test-driven-development
├── verify/     quality-assurance, debugging
├── review/     code-review, security-review, performance-review
└── ship/       documentation
```

---

## Troubleshooting

### Agents not found after install

```bash
ls ~/.config/opencode/agents/ | grep devloom   # Linux
ls ~/Library/Application\ Support/opencode/agents/ | grep devloom  # macOS
```

If the directory is empty, re-run the installer:

```bash
node $(npm root -g)/devloom/postinstall.mjs
```

### ProviderModelNotFoundError

An agent file has a model string without the `opencode/` prefix. DevLoom
auto-fixes this when loading `config.json`, but if you edit files manually
always use the full prefix.

### The weave stops before DEVLOOM_DONE

The model may have hit the `max_steps` limit (default: `200`). For large
projects, increase it in the orchestrator agent file:

```bash
nano ~/.config/opencode/agents/devloom-orchestrator.md
# Change: max_steps: 200 → max_steps: 500
```

### Tests are not detected

QA tries `npm test`, `python -m pytest`, and `go test ./...` in sequence.
If your project uses a different runner, include a note in your prompt:

```
/devloom Build a GraphQL API.
Note: this project uses bun test for testing and bun run build for builds.
```

### A task keeps failing QA

The Orchestrator retries a failed task up to 3 times. On the third failure it
logs the task to `.opencode/devloom/errors.md` and moves on. To manually retry:

1. Open `.opencode/devloom/plan.md` and change `- [x]` back to `- [ ]`
2. Remove its entry from `.opencode/devloom/errors.md`
3. Run `/devloom-status` to confirm it is pending
4. Resume: `/devloom-resume`

---

## Uninstalling

```bash
npm uninstall -g devloom

# Remove global config files
rm ~/.config/opencode/agents/devloom-*.md
rm ~/.config/opencode/commands/devloom*.md
rm -rf ~/.config/opencode/skills/
```

---

## Architecture Reference

```
devloom/
├── src/
│   ├── index.ts              # Plugin entry point (exports DevLoomPlugin)
│   └── plugin.ts             # Lifecycle hooks: event, tool.execute.before/after
├── agents/
│   ├── devloom-orchestrator.md   # primary — loop controller
│   ├── devloom-analyst.md        # subagent — requirements
│   ├── devloom-architect.md      # subagent — design & task list
│   ├── devloom-developer.md      # subagent — code implementation
│   ├── devloom-qa.md             # subagent — tests, lint, verdict
│   └── devloom-documenter.md     # subagent — docs update
├── commands/
│   ├── devloom.md            # /devloom <prompt>
│   ├── devloom-status.md     # /devloom-status
│   ├── devloom-resume.md     # /devloom-resume
│   └── devloom-init.md       # /devloom-init
├── skills/
│   ├── meta/       skill-discovery
│   ├── define/     requirements-analysis
│   ├── plan/       architecture-planning
│   ├── build/      frontend-development, backend-development, api-design,
│   │               incremental-development, test-driven-development
│   ├── verify/     quality-assurance, debugging
│   ├── review/     code-review, security-review, performance-review
│   └── ship/       documentation
├── postinstall.mjs           # Copies agents + commands + skills to config dir
├── package.json
├── tsconfig.json
├── README.md
└── GUIDE.md                  # This file
```

---

*DevLoom — weave your ideas into working software.*
