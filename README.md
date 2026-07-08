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
         |     feature   planner > developer > qa > documenter
         |     bug       developer (root-cause fix) > qa (regression)
         |     refactor  planner > developer > qa
         |     small     developer > qa
         |     docs      planner > documenter
         |     spec/plan planner
         |     explore   verifier (scope=explore)
         |
         +-- CONDITIONAL ADD-ONS (only when touched)
         |     image/screenshot/mockup   vision (first) -> chain for actual intent
         |     UI        verifier (scope=route,form,a11y)
         |     API       verifier (scope=api,contract)
         |     CRUD/data exposure   security (mandatory)
         |     user flow            verifier (scope=journey,state)
         |
         +-- DEFECT LOOP: developer (root-cause fix) > qa (regression), max 3 cycles
         +-- RECOVERY: orchestrator bounded retry, then BLOCKED report
         |
         +-- DEVLOOM_DONE -- chain gates pass
```

### Agent Roster

7 agents — the orchestrator routes; six surgical specialists do the work. Each loads exactly one skill.

| Agent | Mode | Role | Skill | Replaces |
|---|---|---|---|---|
| `devloom-orchestrator` | `primary` | Triage, route, state, completion gate | — | — |
| `devloom-planner` | `subagent` | Prompt -> requirements + CleanArch plan + tickets | `plan/planning` | analyst, architect |
| `devloom-developer` | `subagent` | Implement ticket / root-cause fix (TDD, SOLID) | `build/development` | developer, rca, repair |
| `devloom-qa` | `subagent` | Tests, lint, code review, regression | `verify/quality-assurance` | qa, regression |
| `devloom-verifier` | `subagent` | Runtime app checks by scope (explore/route/dom/form/a11y/api/contract/journey/state) | `verify/app-verification` | explorer, route/form/a11y/api verifiers, journey-agent |
| `devloom-security` | `subagent` | Forensic security review for CRUD/exposure surfaces | `review/security-review` | security |
| `devloom-documenter` | `subagent` | README + API docs + state updates | `ship/documentation` | documenter |
| `devloom-vision` | `subagent` | Analyze images/screenshots/mockups; produces structured descriptions for agents without vision | `build/vision-analysis` | — |

Failure recovery folds into the orchestrator's bounded-retry / BLOCKED logic (no separate agent).

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

## Loop Engineering

**Stop prompting the agent. Design the loop that prompts the agent.**

DevLoom's loop engineering system moves beyond one-shot prompts to recurring,
cadence-driven agent execution. A configured loop runs a pattern on a schedule,
with automatic circuit-breaking via token budget limits.

### Loop patterns (7 built-in)

| Pattern | Purpose |
|---------|---------|
| `daily-triage` | Review new issues, classify, route to planner |
| `pr-babysitter` | Check open PRs for CI status, staleness, conflicts |
| `ci-sweeper` | Retry or investigate failed CI jobs |
| `dependency-sweeper` | Scan for outdated/vulnerable dependencies |
| `changelog-drafter` | Generate changelog from recent commits |
| `post-merge-cleanup` | Clean up merged branches, update tickets |
| `issue-triage` | Triage issue queue with classification and routing |

### Safety levels

| Level | Behavior |
|-------|----------|
| L1 (report-only) | Observe and report — no file modifications |
| L2 (assisted) | Fix with worktree isolation + verifier approval |
| L3 (unattended) | Full autonomous fix-and-close cycle |

### Usage

Start a loop tick manually:

```bash
node scripts/loop-run.mjs --pattern daily-triage
```

In OpenCode, start a background loop:

```
/devloom-loop start daily-triage --cadence "0 8 * * 1-5" --level L2
```

Each tick respects the token budget circuit breaker — if a run exceeds its
budget, the loop pauses and logs the overage before the next scheduled tick.

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
| **go** | OpenCode Go | Highest | Paid | Production delivery |
| **go-economy** | OpenCode Go | High | Lower | Daily development, budget-conscious |
| **free** | OpenCode Free | Good | Zero | Evaluation, learning, hobby projects |

### go profile (max quality)

Uses the strongest OpenCode Go models per role. This is the profile baked into
all DevLoom agent files by default.

Create `.opencode/devloom/config.json`:

```json
{
  "models": {
    "orchestrator": "opencode-go/glm-5.1",
    "planner": "opencode-go/glm-5.1",
    "developer": "opencode-go/kimi-k2.6",
    "qa": "opencode-go/deepseek-v4-pro",
    "verifier": "opencode-go/deepseek-v4-pro",
    "security": "opencode-go/deepseek-v4-pro",
    "documenter": "opencode-go/glm-5.1"
  }
}
```

### go-economy profile

Uses faster, lower-cost Go models while maintaining strong results:

```json
{
  "models": {
    "orchestrator": "opencode-go/deepseek-v4-pro",
    "planner": "opencode-go/kimi-k2.6",
    "developer": "opencode-go/kimi-k2.6",
    "qa": "opencode-go/deepseek-v4-pro",
    "verifier": "opencode-go/deepseek-v4-pro",
    "security": "opencode-go/deepseek-v4-pro",
    "documenter": "opencode-go/qwen3.6-plus"
  }
}
```

### free profile

Uses only OpenCode Free models (zero cost):

```json
{
  "models": {
    "orchestrator": "opencode/big-pickle",
    "planner": "opencode/nemotron-3-ultra-free",
    "developer": "opencode/nemotron-3-ultra-free",
    "qa": "opencode/nemotron-3-ultra-free",
    "verifier": "opencode/nemotron-3-ultra-free",
    "security": "opencode/nemotron-3-ultra-free",
    "documenter": "opencode/nemotron-3-ultra-free"
  }
}
```

### Model-routing table (go)

Each of the 7 agents is assigned a model optimized for its role:

| Agent | Role | Go Model | Rationale |
|---|---|---|---|
| `orchestrator` | Triage, routing, state, gate | `opencode-go/glm-5.1` | Strong instruction following, long-context planning |
| `planner` | Requirements + CleanArch plan | `opencode-go/glm-5.1` | Deep reasoning, architecture + dependency resolution |
| `developer` | Implementation + root-cause fixes | `opencode-go/kimi-k2.6` | Top-tier code generation across all languages |
| `qa` | Tests, lint, code review, regression | `opencode-go/deepseek-v4-pro` | Precise analytical verification |
| `verifier` | Runtime app checks (all scopes) | `opencode-go/deepseek-v4-pro` | Reliable, deterministic inspection |
| `security` | CRUD/exposure forensic review | `opencode-go/deepseek-v4-pro` | Methodical threat reasoning |
| `documenter` | Docs + state update | `opencode-go/glm-5.1` | Documentation quality, readability |

### Prefix requirement

All models MUST use the `opencode/` or `opencode-go/` prefix:

| Correct | Wrong |
|---|---|
| `opencode/nemotron-3-ultra-free` | `nemotron-3-ultra-free` |
| `opencode-go/deepseek-v4-pro` | `deepseek-v4-pro` |

If you forget the prefix, DevLoom adds it automatically and logs a warning.

### First-run interactive setup

If no `config.json` exists, Phase 0 detects available models (`opencode models`),
asks which profile to use (**go**, **go-economy**, or **free**), then
assigns the best model per agent role for the chosen profile.

---

## OpenCode Go Optimization

DevLoom is **purpose-built for OpenCode Go** -- the premium model tier that
delivers the highest-quality results from the OpenCode platform.

### Why go?

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

| Metric | go | go-economy | free |
|---------|-----------|------------|------|
| Gate pass rate (first attempt) | 94% | 82% | 67% |
| Average repair cycles | 0.3 | 0.9 | 1.8 |
| Time to DEVLOOM_DONE | 1x | 1.4x | 2.1x |
| Token cost per weave | 1x | 0.6x | 0x |

Run `opencode models` to see what's currently available in your environment.

---

## Skills

DevLoom ships one focused skill per agent (plus a meta discovery skill). Each skill folds in the relevant engineering standards — SOLID, clean code, clean architecture, TDD, UI/UX (WCAG-AA), and forensic root-cause discipline (no workarounds):

| Category | Skill | Agent |
|----------|-------|-------|
| `plan/` | planning | planner |
| `build/` | development | developer |
| `verify/` | quality-assurance | qa |
| `verify/` | app-verification | verifier |
| `review/` | security-review | security |
| `ship/` | documentation | documenter |
| `meta/` | skill-discovery | orchestrator |

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
+-- agents/                        # 7 agents -- 1 router + 6 specialists
|   +-- devloom-orchestrator.md    # primary -- triage, route, state, gate
|   +-- devloom-planner.md         # subagent -- requirements + CleanArch plan
|   +-- devloom-developer.md       # subagent -- implement / root-cause fix
|   +-- devloom-qa.md              # subagent -- tests, lint, review, regression
|   +-- devloom-verifier.md        # subagent -- runtime app checks by scope
|   +-- devloom-security.md        # subagent -- CRUD + exposure security review
|   +-- devloom-documenter.md      # subagent -- docs + state update
+-- commands/
|   +-- devloom.md
|   +-- devloom-init.md
|   +-- devloom-resume.md
|   +-- devloom-status.md
+-- skills/                      # 7 skill files -- one per agent
+-- protocol/                    # shared operating rules and contracts
+-- project/                     # project workspace standard and templates
+-- __tests__/                   # Jest test suites
+-- postinstall.mjs
+-- GUIDE.md
+-- SECURITY.md
+-- package.json
```
---

## Acknowledgements

DevLoom's skill structure and lifecycle-driven workflow drew inspiration from
[addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) and the
broader pattern of packaging senior-engineering workflows as agent-readable
skills.

---

## License

MIT
