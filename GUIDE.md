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
  AI dir      : /home/you/.config/opencode/devloom-ai

Installing agents:
  - Agent: devloom-orchestrator
  - Agent: devloom-planner
  - Agent: devloom-developer
  - Agent: devloom-qa
  - Agent: devloom-verifier
  - Agent: devloom-security
  - Agent: devloom-documenter
  - Agent: devloom-vision

Installing commands:
  - Command: /devloom
  - Command: /devloom-status
  - Command: /devloom-resume
  - Command: /devloom-init
  - Command: /devloom-save

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
On load, the plugin bootstraps `.opencode/devloom/project/` and normalizes any
legacy DevLoom workspace files into the compact canonical format.

---

## Verifying the Installation

Start OpenCode and open the command palette by typing `/`:

```
/devloom          → Weave a full feature from a single prompt
/devloom-status   → Show current weaving progress
/devloom-resume   → Resume an interrupted execution
/devloom-init     → Initialize a project for DevLoom
/devloom-save     → Persist current state and pause for the next command
```

Or check installed files directly:

```bash
# Linux / macOS
ls ~/.config/opencode/agents/ | grep devloom

# Expected:
devloom-developer.md
devloom-documenter.md
devloom-orchestrator.md
devloom-planner.md
devloom-qa.md
devloom-security.md
devloom-verifier.md
```

All installed `devloom-*` subagents are callable by `devloom-orchestrator`
during normal autonomous runs. You may invoke them manually, but they are not
restricted to manual-only use.
The expected behavior is delegation by default: the orchestrator routes and
persists state, while the matching subagent executes each specialist phase.

---

## Configuring Models

### Default (no config)

All agents default to `opencode/nemotron-3-ultra-free` — a capable free model.

### Model Routing — Three Profiles

DevLoom provides three model profiles that trade off quality vs cost:

| Profile | Use case | Tier |
|---|---|---|
| `go` | Production-grade builds, maximum quality | Go (paid) |
| `go-economy` | Good quality at lower cost | Go (paid) |
| `free` | Zero-cost experimentation | Free |

The profile determines which model is assigned to each of the 8 agent roles. Premium roles (planner, QA, verifier, security) get stronger models; the `vision` role always uses a multimodal model regardless of profile. The default `go-flash` puts every non-vision role on DeepSeek V4 Flash.

#### go (max quality — default is go-flash)

```json
{
  "models": {
    "orchestrator": "opencode-go/glm-5.1",
    "planner": "opencode-go/glm-5.1",
    "developer": "opencode-go/kimi-k2.6",
    "qa": "opencode-go/deepseek-v4-pro",
    "verifier": "opencode-go/deepseek-v4-pro",
    "security": "opencode-go/deepseek-v4-pro",
    "documenter": "opencode-go/glm-5.1",
    "vision": "opencode-go/minimax-m3"
  }
}
```

#### go-economy

```json
{
  "models": {
    "orchestrator": "opencode-go/deepseek-v4-pro",
    "planner": "opencode-go/kimi-k2.6",
    "developer": "opencode-go/kimi-k2.6",
    "qa": "opencode-go/deepseek-v4-pro",
    "verifier": "opencode-go/deepseek-v4-pro",
    "security": "opencode-go/deepseek-v4-pro",
    "documenter": "opencode-go/qwen3.6-plus",
    "vision": "opencode-go/minimax-m3"
  }
}
```

#### free

```json
{
  "models": {
    "orchestrator": "opencode/big-pickle",
    "planner": "opencode/nemotron-3-ultra-free",
    "developer": "opencode/nemotron-3-ultra-free",
    "qa": "opencode/nemotron-3-ultra-free",
    "verifier": "opencode/nemotron-3-ultra-free",
    "security": "opencode/nemotron-3-ultra-free",
    "documenter": "opencode/nemotron-3-ultra-free",
    "vision": "opencode-go/minimax-m3"
  }
}
```

### Per-project override

Create `.opencode/devloom/config.json` in your project root with your chosen profile above. Every DevLoom command (`/devloom`, `/devloom-init`, `/devloom-resume`) reads this file before invoking the orchestrator and applies the models to the global agent files. Local config always wins.

You can also override individual agents by providing a partial `models` map — only specified roles are changed, others keep their existing assignment.

### Prefix requirement

All models MUST use the `opencode/` or `opencode-go/` prefix:

| Correct | Wrong |
|---|---|
| `opencode/nemotron-3-ultra-free` | `nemotron-3-ultra-free` |
| `opencode-go/deepseek-v4-pro` | `deepseek-v4-pro` |

If you forget the prefix, DevLoom adds it automatically and logs a warning.

### First-run interactive setup

If no `config.json` exists, Phase 0 detects available models (`opencode models`), asks which profile to use (**go**, **go-economy**, or **free**), then assigns models per agent role matching the selected profile.

### Available models

**Free tier** (`opencode/` — zero cost):

| Model string |
|---|
| `opencode/big-pickle` |
| `opencode/deepseek-v4-flash-free` |
| `opencode/mimo-v2.5-free` |
| `opencode/nemotron-3-ultra-free` |

**Go tier** (`opencode-go/` — higher quality, paid):

| Model string |
|---|
| `opencode-go/glm-5` |
| `opencode-go/glm-5.1` |
| `opencode-go/kimi-k2.5` |
| `opencode-go/kimi-k2.6` |
| `opencode-go/deepseek-v4-pro` |
| `opencode-go/deepseek-v4-flash` |
| `opencode-go/minimax-m2.5` |
| `opencode-go/minimax-m2.7` |
| `opencode-go/minimax-m3` |
| `opencode-go/mimo-v2.5` |
| `opencode-go/mimo-v2.5-pro` |
| `opencode-go/qwen3.6-plus` |
| `opencode-go/qwen3.7-plus` |
| `opencode-go/qwen3.7-max` |

### Checking available models

Run `opencode models` in your terminal to see which models are currently available in your environment. Available models vary by region and subscription tier.

### Global override (advanced)

Edit the agent files at `~/.config/opencode/agents/` directly:

```bash
sed -i 's|^model:.*|model: opencode-go/deepseek-v4-pro|' \
  ~/.config/opencode/agents/devloom-*.md
```

### Updating global agents after config change

After modifying `.opencode/devloom/config.json` (e.g., switching profiles or overriding individual models), run `/devloom-init` or start a new weave with `/devloom`. DevLoom re-reads the config and updates the global agent files at `~/.config/opencode/agents/devloom-*.md` automatically.

If you prefer a manual refresh:

```bash
node $(npm root -g)/devloom/postinstall.mjs
```

This re-installs agent files from the installed package. Then start a weave to apply your config models.

---

## Usage

### Start a weaving session

Navigate to your project directory, then open OpenCode:

```bash
cd /path/to/your/project
opencode
```

If this is the first time DevLoom is used in the project, or the project has an
older DevLoom workspace, plugin startup normalizes `.opencode/devloom/project/`
before command execution.

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

The orchestrator first **triages** the prompt and picks the minimal agent chain
for the intent (bug → developer-fix>qa-regression; docs → planner>documenter;
small change → developer>qa; etc. — see `workflow.dsl` CHAINS). Verifier
agents are added only when the work touches their surface (UI, API, CRUD/data
exposure, user flows). The full sequence below runs only for a feature that
touches all surfaces:

**Phase 0 — Model Setup**

If `.opencode/devloom/config.json` exists, its models are loaded and applied
immediately. Otherwise the orchestrator detects available models, asks your
preference (Free or Go tier), and assigns models per agent role.

**Phase 1 — Understand & Plan**

The Planner explores your codebase, writes `.opencode/devloom/requirements.md`,
then a CleanArch `.opencode/devloom/plan.md` with an ordered, dependency-resolved
task list (it can run REQ-only, PLAN-only, or both).
Before phase routing, the orchestrator appends the current user prompt as the
last item in `.opencode/devloom/project/tasks/TODO.md`, loads relevant memory
and skills, and keeps ticket/todo/plan artifacts synchronized.

**Phase 2 — Implementation & QA Loop**

For each task in the plan:
1. The Developer implements the code (TDD, SOLID, clean architecture).
2. QA writes tests, runs the linter, runs the full test suite, reviews the code,
   runs targeted regression, and reports `QA_PASS` or `QA_FAIL`.
3. On failure: the Orchestrator routes the defect back to the Developer for a
   root-cause fix (no workarounds), then QA regression. Up to 3 fix cycles per
   defect, then the ticket is marked blocked.
4. The Orchestrator marks the task `[x]` in `.opencode/devloom/plan.md`.

**Runtime verification (only when the change touches a surface)**

A single Verifier agent runs the requested scope(s) against the running app —
the running app is the source of truth, not specs. Scopes:
- `explore` — discover routes, pages, buttons, forms, modals, tables.
- `route` + `dom` — HTTP status, content, console errors, DOM integrity.
- `form` — valid/invalid/boundary submissions, validation, loading/error/success.
- `a11y` — ARIA, labels, keyboard nav, focus, contrast, semantic HTML.
- `api` + `contract` — auth, validation, schema, status codes; runtime vs OpenAPI.
- `journey` + `state` — generated user flows and state-transition coverage.

The orchestrator adds only the scopes the change requires (UI → route/form/a11y,
API → api/contract, user flow → journey/state).

**Security (mandatory on exposure)**

The `devloom-security` subagent is mandatory whenever a CRUD endpoint changes or
when a component/module starts exposing internal data through input or output
boundaries. It performs a forensic, evidence-based review.

**Acceptance Gate (Final)**

The Documenter updates README.md and any API docs.
The Orchestrator runs the final acceptance gate against the criteria relevant to
the chosen chain:

```
build: pass
lint: pass
unit_tests: pass
integration_tests: pass
e2e_tests: pass
all_routes_visited: pass
all_buttons_tested: pass
all_forms_tested: pass
all_links_verified: pass
all_user_journeys_passed: pass
all_api_endpoints_verified: pass
accessibility_verified: pass
responsive_layout_verified: pass
visual_validation_verified: pass
performance_validation_verified: pass
security_validation_verified: pass
no_open_defects: pass
```

If any gate fails, the Orchestrator routes back to the Developer for a
root-cause fix and re-verification. `DEVLOOM_DONE` is output only when all gates
for the chosen chain pass.

Completed output example:
```
DEVLOOM_DONE — ALL GATES PASSED

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

Each agent loads exactly one skill via its `LOAD:` directive. The skill folds in
the relevant engineering standards (SOLID, clean code, clean architecture, TDD,
UI/UX, forensic root-cause discipline). The `skill-discovery` meta-skill maps
task domains to the right agent skill.

```
# Each agent's body declares its skill via LOAD:
LOAD: ...|~/.config/opencode/skills/build/development.md
```

Skills are stored in `~/.config/opencode/skills/` following the
[agent-skills](https://github.com/addyosmani/agent-skills) convention:

```
skills/
├── meta/       skill-discovery   (orchestrator)
├── plan/       planning          (planner)
├── build/      development       (developer)
├── verify/     quality-assurance (qa)
│               app-verification  (verifier)
├── review/     security-review   (security)
└── ship/       documentation     (documenter)
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

This error means an agent file references a model that is not available in your environment. Common causes:

1. **Wrong prefix** — model string missing `opencode/` or `opencode-go/`. DevLoom auto-fixes this when loading `config.json`.
2. **Model not available** — some Go models may not be available in your region or subscription. Run `opencode models` to list available models.
3. **Outdated agent files** — global agent files may reference a model that no longer exists. Re-run the installer and apply config:

```bash
node $(npm root -g)/devloom/postinstall.mjs
```

Then update your `.opencode/devloom/config.json` with models from the available list and start a new weave.

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

The Orchestrator routes failures to:
1. Root Cause Analysis — determines the root cause
2. Repair Agent — applies minimal fix
3. Regression Verification — re-runs all tests

Up to 3 repair cycles per defect, then the defect is marked `escalated` in the
registry and the task is skipped. To manually retry an escalated task:

1. Open `.opencode/devloom/plan.md` and change `- [x]` back to `- [ ]`
2. Open `.opencode/devloom/defects.json` and remove or reset the defect
3. Run `/devloom-status` to confirm it is pending
4. Resume: `/devloom-resume`

### The acceptance gate is failing

Check `.opencode/devloom/defects.json` for open defects. Common gate failures:

| Gate | Common Cause |
|------|-------------|
| `all_routes_visited` | Explorer didn't discover all routes — check app starts correctly |
| `all_forms_tested` | Form verifier found validation issues — check error/success handling |
| `no_open_defects` | Defects in registry need repair — run RCA + Repair |
| `accessibility_verified` | ARIA labels or keyboard nav missing — check semantic HTML |
| `build` | Repair may have introduced build error — Recovery Agent auto-fixes most |

### The Recovery Agent keeps retrying

The Recovery Agent retries 3 times per failure type. If all 3 attempts fail,
the defect is marked `escalated`. Check `.opencode/devloom/recovery-log.md`
for the full recovery attempt history.

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

## Security Considerations

### Permissions

DevLoom operates with your user permissions. It does not escalate privileges.
The agent `permission` blocks in `~/.config/opencode/agents/devloom-*.md` define
what each agent can do (edit files, run shell commands, fetch URLs, etc.).
Review these permissions and restrict them if needed.

### Prompt Sanitization

User prompts are truncated to 4000 characters and control characters are stripped
before they reach the orchestrator. This provides basic injection prevention.
However, AI agents may still follow instructions embedded in prompts — always
review generated output critically.

### Path Traversal Protection

The `postinstall.mjs` script validates all destination paths to ensure they stay
within the OpenCode config directory (`~/.config/opencode/`). Paths containing
`..` or absolute paths outside the config directory are rejected.

### Reporting Vulnerabilities

See [SECURITY.md](SECURITY.md) for our responsible disclosure policy.

### Best Practices

- Pin exact versions in `package.json` instead of using ranges.
- Review all generated code before committing or deploying.
- Run `npm audit` regularly to check dependency vulnerabilities.
- Keep DevLoom state in `.opencode/devloom/` and add it to `.gitignore` if you
  do not want execution state tracked in version control.

---

## Architecture Reference

```
devloom/
├── src/
│   ├── index.ts                   # Plugin entry point (exports DevLoomPlugin)
│   └── plugin.ts                  # Lifecycle hooks: event, tool.execute.before/after
├── agents/                         # 7 agents — 1 router + 6 specialists
│   ├── devloom-orchestrator.md    # primary — triage, route, state, gate
│   ├── devloom-planner.md         # subagent — requirements + CleanArch plan
│   ├── devloom-developer.md       # subagent — implement / root-cause fix (TDD, SOLID)
│   ├── devloom-qa.md              # subagent — tests, lint, code review, regression
│   ├── devloom-verifier.md        # subagent — runtime app checks by scope
│   ├── devloom-security.md        # subagent — CRUD + exposure security review
│   └── devloom-documenter.md      # subagent — docs + state update
├── commands/
│   ├── devloom.md             # /devloom <prompt>
│   ├── devloom-init.md        # /devloom-init
│   ├── devloom-resume.md      # /devloom-resume
│   └── devloom-status.md      # /devloom-status
├── skills/                        # 7 skill files — one per agent
│   ├── meta/       skill-discovery
│   ├── plan/       planning            (planner)
│   ├── build/      development         (developer)
│   ├── verify/     quality-assurance   (qa)
│   │               app-verification    (verifier)
│   ├── review/     security-review     (security)
│   └── ship/       documentation       (documenter)
├── __tests__/                    # Unit tests (Jest)
│   ├── index.test.ts             # Plugin smoke test
│   ├── plugin.test.ts            # Lifecycle hook tests
│   └── postinstall.test.ts       # Post-install security + path tests
├── postinstall.mjs               # Copies agents + commands + skills to config dir
├── SECURITY.md                   # Security policy and disclosure
├── jest.config.mjs               # Jest test configuration
├── package.json
├── tsconfig.json
├── README.md
├── GUIDE.md                      # This file
└── .github/workflows/ci.yml      # CI pipeline (Node 18, 20, 22)
```

---

*DevLoom — weave your ideas into working software.*
