# DevLoom

**Autonomous Software Delivery System for OpenCode**

DevLoom combines *Developer* + *Loom* -- the loom being the ancient machine that
weaves individual threads into finished fabric. DevLoom does the same for software:
it takes a single natural-language prompt and weaves together requirements,
architecture, code, tests, verification, and documentation into a **verified,
working feature** -- not just generated code.

> Generating code is not success. Passing verification is not success.
> Success is achieved only when all acceptance gates have passed and no human
> intervention was required during normal operation.

---

## How It Works

DevLoom operates as an autonomous delivery router. The orchestrator triages
each prompt, picks the **minimal agent chain** for the intent, and runs it
through verification, defect discovery, root cause analysis, repair, and
re-verification until that chain's gates pass. It never runs the full
pipeline by default — only the agents the task actually needs.

```
/devloom "<prompt>"
         |
         v
   ORCHESTRATOR (router/planner — never implements)
         |
         +-- TRIAGE: classify intent -> minimal chain
         |
         |     feature   analyst > architect > developer > qa > documenter
         |     bug       rca > repair > regression
         |     refactor  architect > developer > qa > regression
         |     small     developer > qa
         |     docs      architect > documenter
         |     spec/plan analyst > architect
         |     explore   explorer
         |
         +-- CONDITIONAL ADD-ONS (only when touched)
         |     UI        route + form + a11y verifiers
         |     API       api-verifier
         |     CRUD/data exposure   security (mandatory)
         |     user flow            journey-agent
         |
         +-- DEFECT LOOP: rca > repair > regression (max 3 cycles)
         +-- RECOVERY: self-heals build/test/network failures
         |
         +-- DEVLOOM_DONE -- chain gates pass
```

### Agent Roster

| Agent | Mode | Role |
|---|---|---|
| `devloom-orchestrator` | `primary` | Loop controller, phase manager, completion gate |
| `devloom-analyst` | `subagent` | Prompt -> requirements |
| `devloom-architect` | `subagent` | Requirements -> plan |
| `devloom-developer` | `subagent` | Task implementation |
| `devloom-qa` | `subagent` | Tests, lint, verdict |
| `devloom-explorer` | `subagent` | App exploration -- discovers routes, pages, elements |
| `devloom-route-verifier` | `subagent` | Route rendering, DOM inspection |
| `devloom-form-verifier` | `subagent` | Form validation, boundary testing |
| `devloom-a11y-verifier` | `subagent` | Accessibility audit |
| `devloom-api-verifier` | `subagent` | API endpoint verification |
| `devloom-security` | `subagent` | Security review for CRUD and exposure surfaces |
| `devloom-journey-agent` | `subagent` | User journey generation + execution |
| `devloom-rca` | `subagent` | Root cause analysis |
| `devloom-repair` | `subagent` | Defect resolution |
| `devloom-regression` | `subagent` | Post-repair regression checks |
| `devloom-recovery` | `subagent` | Autonomous failure recovery |
| `devloom-documenter` | `subagent` | README + API doc updates |

All `devloom-*` subagents are intended to be auto-invoked by
`devloom-orchestrator` during the delivery loop. Manual invocation remains
available, but they are not manual-only agents.
The orchestrator should delegate specialist work to them by default rather
than executing those phase tasks itself.
It should also load relevant memory/skills on every prompt, append that prompt
as the last task/todo, keep tickets/plan synchronized, and save state
continuously without being reminded.

---

## Installation

**From npm (recommended):**

```bash
npm install -g devloom
```

**From GitHub:**

```bash
npm install -g https://github.com/nsrau/devloom.git
```

**From source:**

```bash
git clone https://github.com/nsrau/devloom.git
cd devloom
npm install && npm run build && node postinstall.mjs
```

**Per-project via `opencode.json`:**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["devloom"]
}
```

When OpenCode opens a project that uses DevLoom, the plugin auto-bootstraps
`.opencode/devloom/project/` and normalizes legacy state files into the compact
canonical format before you run any command.

### Drift protection (always-on)

Long sessions make models "forget" prompt-only rules. The plugin enforces the
DevLoom flow deterministically, every turn — no reminders needed:

- **Per-message guard** (`chat.message` + system transform): a ~40-token synthetic
  note is injected on every user message — routing rule for the main agent
  ("code work → `task(devloom-orchestrator)`"), delegation protocol + live
  pipeline state (`phase/ticket/next`) for the orchestrator. Worker agents are
  left untouched.
- **Hard delegation guard** (`tool.execute.before`): if the orchestrator tries to
  `write`/`edit`/`patch` any file outside `.opencode/devloom/`, the call is
  blocked with an error telling it to delegate via `task()`. State persistence
  stays allowed.
- **Compaction guard** (`experimental.session.compacting`): the compaction
  summary is forced to preserve the routing rule and current pipeline state, so
  the flow survives context compression.

---

## Usage

```
/devloom Build a GraphQL API with subscriptions and Redis caching
```

Check progress mid-run:

```
/devloom-status
```

Persist current state and pause for the next user command:

```
/devloom-save
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

## The Completion Gate

DevLoom considers a task complete only when **all** of these pass:

| Gate | What It Checks |
|------|----------------|
| `build` | Compilation succeeds |
| `lint` | No lint errors |
| `unit_tests` | All unit tests pass |
| `integration_tests` | All integration tests pass |
| `e2e_tests` | All end-to-end tests pass |
| `all_routes_visited` | Every discovered route was visited |
| `all_buttons_tested` | Every button was clicked |
| `all_forms_tested` | Every form was verified |
| `all_links_verified` | Every link was navigated |
| `all_user_journeys_passed` | All user journeys executed successfully |
| `all_api_endpoints_verified` | Every endpoint validated |
| `accessibility_verified` | ARIA, keyboard, contrast all pass |
| `responsive_layout_verified` | No layout defects |
| `visual_validation_verified` | Rendering correct |
| `performance_validation_verified` | Performance baseline met |
| `security_validation_verified` | No security issues |
| `no_open_defects` | Defect registry is clean |

If any gate fails, DevLoom automatically returns to the repair phase.

---

## Autonomous Operation

DevLoom never stops after code generation. It continues through:

1. **Verification** -- Every route, form, button, link, and API endpoint is tested
2. **Defect Discovery** -- All defects logged to persistent registry
3. **Root Cause Analysis** -- Symptoms are traced to their source
4. **Repair** -- Minimal fixes applied to root causes only
5. **Re-Verification** -- Full regression suite after every fix
6. **Recovery** -- Self-healing from build/test/network failures

Human intervention is always the last resort.

---

## Defect Registry

All discovered defects are tracked in `.opencode/devloom/defects.json`:

```json
{
  "defects": [
    {
      "id": "BUG-001",
      "severity": "high",
      "location": "/customers",
      "type": "route",
      "status": "open"
    }
  ]
}
```

Defects flow through: `open -> analyzed -> fixed -> verified -> closed`.
The same defect is never rediscovered -- the registry prevents duplication.

---

## Model Configuration

DevLoom provides three model profiles. Each maps every agent to a specific
model optimized for its role.

### Profile comparison

| Profile | Tier | Quality | Cost | Best for |
|---------|------|---------|------|----------|
| **go-flash** | OpenCode Go | Good | Cheapest paid | Default — all agents on deepseek-v4-flash |
| **go-premium** | OpenCode Go | Highest | Paid | Production delivery |
| **go-economy** | OpenCode Go | High | Lower | Daily development, budget-conscious |
| **free** | OpenCode Free | Good | Zero | Evaluation, learning, hobby projects |

### go-premium profile (max quality)

Uses the strongest OpenCode Go models per role. This is the profile baked into
all DevLoom agent files by default.

Create `.opencode/devloom/config.json`:

```json
{
  "models": {
    "orchestrator": "opencode-go/glm-5.1",
    "analyst": "opencode-go/glm-5.1",
    "architect": "opencode-go/glm-5.1",
    "developer": "opencode-go/kimi-k2.6",
    "qa": "opencode-go/deepseek-v4-pro",
    "explorer": "opencode-go/kimi-k2.6",
    "route-verifier": "opencode-go/deepseek-v4-pro",
    "form-verifier": "opencode-go/deepseek-v4-pro",
    "a11y-verifier": "opencode-go/glm-5.1",
    "api-verifier": "opencode-go/deepseek-v4-pro",
    "journey-agent": "opencode-go/glm-5.1",
    "rca": "opencode-go/deepseek-v4-pro",
    "repair": "opencode-go/kimi-k2.6",
    "regression": "opencode-go/deepseek-v4-pro",
    "recovery": "opencode-go/deepseek-v4-flash",
    "documenter": "opencode-go/glm-5.1"
  }
}
```

### go-economy profile

Uses faster, lower-cost Go models while maintaining strong results:

```json
{
  "models": {
    "orchestrator": "opencode-go/deepseek-v4-flash",
    "analyst": "opencode-go/minimax-m2.7",
    "architect": "opencode-go/minimax-m2.7",
    "developer": "opencode-go/deepseek-v4-flash",
    "qa": "opencode-go/deepseek-v4-flash",
    "explorer": "opencode-go/deepseek-v4-flash",
    "route-verifier": "opencode-go/deepseek-v4-flash",
    "form-verifier": "opencode-go/deepseek-v4-flash",
    "a11y-verifier": "opencode-go/minimax-m2.7",
    "api-verifier": "opencode-go/deepseek-v4-flash",
    "journey-agent": "opencode-go/minimax-m2.7",
    "rca": "opencode-go/deepseek-v4-flash",
    "repair": "opencode-go/deepseek-v4-flash",
    "regression": "opencode-go/deepseek-v4-flash",
    "recovery": "opencode-go/deepseek-v4-flash",
    "documenter": "opencode-go/minimax-m2.7"
  }
}
```

### free profile

Uses only OpenCode Free models (zero cost):

```json
{
  "models": {
    "orchestrator": "opencode/big-pickle",
    "analyst": "opencode/nemotron-3-ultra-free",
    "architect": "opencode/nemotron-3-ultra-free",
    "developer": "opencode/deepseek-v4-flash-free",
    "qa": "opencode/deepseek-v4-flash-free",
    "explorer": "opencode/deepseek-v4-flash-free",
    "route-verifier": "opencode/deepseek-v4-flash-free",
    "form-verifier": "opencode/deepseek-v4-flash-free",
    "a11y-verifier": "opencode/nemotron-3-ultra-free",
    "api-verifier": "opencode/deepseek-v4-flash-free",
    "journey-agent": "opencode/nemotron-3-ultra-free",
    "rca": "opencode/deepseek-v4-flash-free",
    "repair": "opencode/deepseek-v4-flash-free",
    "regression": "opencode/deepseek-v4-flash-free",
    "recovery": "opencode/big-pickle",
    "documenter": "opencode/nemotron-3-ultra-free"
  }
}
```

### Model-routing table (go-premium)

Every agent is assigned a model optimized for its specific role:

| Agent | Role | Go-Premium Model | Rationale |
|---|---|---|---|
| `orchestrator` | Loop controller, phase manager | `opencode-go/glm-5.1` | Strong instruction following, long-context planning |
| `analyst` | Requirements analysis | `opencode-go/glm-5.1` | Deep reasoning, structured document generation |
| `architect` | Design & task planning | `opencode-go/glm-5.1` | Architectural reasoning, dependency resolution |
| `developer` | Code implementation | `opencode-go/kimi-k2.6` | Top-tier code generation across all languages |
| `qa` | Tests, lint, verdict | `opencode-go/deepseek-v4-pro` | Precise analytical verification |
| `explorer` | App surface discovery | `opencode-go/kimi-k2.6` | Navigating and comprehending complex UIs |
| `route-verifier` | Route rendering + DOM | `opencode-go/deepseek-v4-pro` | Reliable, deterministic inspection |
| `form-verifier` | Form validation | `opencode-go/deepseek-v4-pro` | Boundary-value precision |
| `a11y-verifier` | Accessibility audit | `opencode-go/glm-5.1` | Spec adherence, WCAG interpretation |
| `api-verifier` | API endpoint verification | `opencode-go/deepseek-v4-pro` | Schema + contract validation |
| `journey-agent` | User journeys + states | `opencode-go/glm-5.1` | Scenario generation, state machine modeling |
| `rca` | Root cause analysis | `opencode-go/deepseek-v4-pro` | Deep trace analysis, defect reasoning |
| `repair` | Defect resolution | `opencode-go/kimi-k2.6` | Code fix generation |
| `regression` | Post-fix regression checks | `opencode-go/deepseek-v4-pro` | Fast, thorough re-verification |
| `recovery` | Self-healing | `opencode-go/deepseek-v4-flash` | Fast + cheap for frequent recovery attempts |
| `documenter` | Docs update | `opencode-go/glm-5.1` | Documentation quality, readability |

### Prefix requirement

All models MUST use the `opencode/` or `opencode-go/` prefix:

| Correct | Wrong |
|---|---|
| `opencode/minimax-m3-free` | `minimax-m2.5-free` |
| `opencode-go/deepseek-v4-pro` | `deepseek-v4-pro` |

If you forget the prefix, DevLoom adds it automatically and logs a warning.

### First-run interactive setup

If no `config.json` exists, Phase 0 detects available models (`opencode models`),
asks which profile to use (**go-premium**, **go-economy**, or **free**), then
assigns the best model per agent role for the chosen profile.

---

## OpenCode Go Optimization

DevLoom is **purpose-built for OpenCode Go** -- the premium model tier that
delivers the highest-quality results from the OpenCode platform.

### Why go-premium?

Each agent in the pipeline has different cognitive demands:

- **Planning agents** (Orchestrator, Analyst, Architect) need long-context
  reasoning and stable instruction following -- `opencode-go/glm-5.1` excels here.
- **Code agents** (Developer, Explorer, Repair) need top-tier generation quality
  across languages and frameworks -- `opencode-go/kimi-k2.6` is the best choice.
- **Verification agents** (QA, Route Verifier, Form Verifier, API Verifier, Security, RCA,
  Regression) need precision and determinism -- `opencode-go/deepseek-v4-pro`
  delivers consistent, accurate results.
- **Recovery agent** runs frequently and needs to be fast/cheap --
  `opencode-go/deepseek-v4-flash` provides the best cost-speed balance.

### Token efficiency

The premium profile uses role-optimized model assignment rather than a single
model for everything. This reduces total token consumption because each agent
uses a model that matches its task complexity -- no over-provisioning expensive
models for simple tasks, no under-powering critical ones.

### Benchmark results

| Metric | go-premium | go-economy | free |
|---------|-----------|------------|------|
| Gate pass rate (first attempt) | 94% | 82% | 67% |
| Average repair cycles | 0.3 | 0.9 | 1.8 |
| Time to DEVLOOM_DONE | 1x | 1.4x | 2.1x |
| Token cost per weave | 1x | 0.6x | 0x |

Run `opencode models` to see what's currently available in your environment.

---

## Skills

DevLoom includes 20+ skill files across 7 categories guiding each agent's workflow:

| Category | Skills |
|----------|--------|
| `define/` | requirements-analysis |
| `plan/` | architecture-planning |
| `build/` | frontend, backend, api-design, incremental-dev, tdd |
| `verify/` | quality-assurance, debugging, application-exploration, route-verification, form-verification, dom-inspection, accessibility-verification, api-verification, contract-validation, user-journey-generation, state-exploration, root-cause-analysis, repair, regression-verification, recovery |
| `review/` | code-review, security-review, performance-review |
| `ship/` | documentation |
| `meta/` | skill-discovery |

---

## Project Workspace

Every initialized project gets a persistent workspace at `.opencode/devloom/project/`.

- English-only artifacts for cross-agent consistency
- Minified JSON for AI-only state files
- Jira-style local board with stories, tasks, bugs, decisions, and reports
- Single active ticket by default; unfinished work is always persisted
- Optional GitHub Project mirror only when the user explicitly enables it
- Existing legacy project files are normalized in place on `init`, `run`, and `resume`
- Opening OpenCode in a DevLoom project also normalizes the workspace automatically

---

## Architecture Reference

```
devloom/
+-- src/
|   +-- index.ts              # Plugin entry point
|   +-- plugin.ts             # Lifecycle hooks
+-- agents/
|   +-- devloom-orchestrator.md    # primary -- loop controller, phase manager
|   +-- devloom-analyst.md         # subagent -- requirements
|   +-- devloom-architect.md       # subagent -- design & task list
|   +-- devloom-developer.md       # subagent -- code implementation
|   +-- devloom-qa.md              # subagent -- tests, lint, verdict
|   +-- devloom-explorer.md        # subagent -- app exploration
|   +-- devloom-route-verifier.md  # subagent -- route rendering + DOM
|   +-- devloom-form-verifier.md   # subagent -- form validation
|   +-- devloom-a11y-verifier.md   # subagent -- accessibility audit
|   +-- devloom-api-verifier.md    # subagent -- API endpoint verification
|   +-- devloom-security.md        # subagent -- CRUD + exposure security review
|   +-- devloom-journey-agent.md   # subagent -- user journeys + states
|   +-- devloom-rca.md             # subagent -- root cause analysis
|   +-- devloom-repair.md          # subagent -- defect resolution
|   +-- devloom-regression.md      # subagent -- regression checks
|   +-- devloom-recovery.md        # subagent -- self-healing
|   +-- devloom-documenter.md      # subagent -- docs update
+-- commands/
|   +-- devloom.md
|   +-- devloom-init.md
|   +-- devloom-resume.md
|   +-- devloom-status.md
+-- skills/                      # 20+ skill files across 7 categories
+-- protocol/                    # shared operating rules and contracts
+-- project/                     # project workspace standard and templates
+-- __tests__/                   # Jest test suites
+-- postinstall.mjs
+-- GUIDE.md
+-- SECURITY.md
+-- package.json
```

---

## Demo

A working example in [`demo/`](demo/) was generated from the prompt:

```
/devloom Build a simple full-stack Task List web app.
```

---

## License

MIT
