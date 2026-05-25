# DevLoom

**Autonomous Software Delivery System for OpenCode**

DevLoom combines *Developer* + *Loom* — the loom being the ancient machine that
weaves individual threads into finished fabric. DevLoom does the same for software:
it takes a single natural-language prompt and weaves together requirements,
architecture, code, tests, verification, and documentation into a **verified,
working feature** — not just generated code.

> Generating code is not success. Passing verification is not success.
> Success is achieved only when all acceptance gates have passed and no human
> intervention was required during normal operation.

---

## How It Works

DevLoom operates as a fully autonomous delivery pipeline. Instead of stopping
after code generation, it continues through verification, defect discovery,
root cause analysis, repair, and re-verification until all gates pass.

```
/devloom "Build a REST API for user management with JWT auth"
         │
         ▼
   DEVLoom ORCHESTRATOR
         │
         ├── Phase 1: Analayst + Architect → plan.md
         │
         ├── Phase 2: Implementation & QA Loop
         │   ├── Developer implements
         │   ├── QA verifies, tests, lints
         │   └── Repair loop (max 3 cycles per defect)
         │
         ├── Phase 3: Application Explorer
         │   └── Discovers routes, pages, buttons, forms, modals, tables...
         │
         ├── Phase 4: Route / Form / UI / A11y Verification
         │   ├── Route verifier — every page renders, DOM integrity
         │   ├── Form verifier — valid/invalid/boundary submissions
         │   └── A11y verifier — ARIA, keyboard nav, color contrast
         │
         ├── Phase 5: API Verification + Contract Validation
         │   ├── Every endpoint: auth, validation, output schema
         │   └── OpenAPI spec generation + runtime comparison
         │
         ├── Phase 6: User Journeys + State Exploration
         │   ├── Auto-generated journeys (Register→Login→CRUD→Logout)
         │   └── State machine transition testing
         │
         ├── Phase 7: Cross-cutting (Performance + Security)
         │
         ├── Phase 8: Acceptance Gate (17 criteria)
         │   └── build, lint, tests, routes, buttons, forms, links,
         │       journeys, APIs, a11y, perf, security, no open defects
         │
         ├── Recovery Agent (always active)
         │   └── Self-heals build/test/network failures
         │
         └── DEVLOOM_DONE — all gates pass
```

### Agent Roster

| Agent | Mode | Role |
|---|---|---|
| `devloom-orchestrator` | `primary` | Loop controller, phase manager, completion gate |
| `devloom-analyst` | `subagent` | Prompt → requirements |
| `devloom-architect` | `subagent` | Requirements → plan |
| `devloom-developer` | `subagent` | Task implementation |
| `devloom-qa` | `subagent` | Tests, lint, verdict |
| `devloom-explorer` | `subagent` | App exploration — discovers routes, pages, elements |
| `devloom-route-verifier` | `subagent` | Route rendering, DOM inspection |
| `devloom-form-verifier` | `subagent` | Form validation, boundary testing |
| `devloom-a11y-verifier` | `subagent` | Accessibility audit |
| `devloom-api-verifier` | `subagent` | API endpoint verification |
| `devloom-journey-agent` | `subagent` | User journey generation + execution |
| `devloom-rca` | `subagent` | Root cause analysis |
| `devloom-repair` | `subagent` | Defect resolution |
| `devloom-regression` | `subagent` | Post-repair regression checks |
| `devloom-recovery` | `subagent` | Autonomous failure recovery |
| `devloom-documenter` | `subagent` | README + API doc updates |

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

1. **Verification** — Every route, form, button, link, and API endpoint is tested
2. **Defect Discovery** — All defects logged to persistent registry
3. **Root Cause Analysis** — Symptoms are traced to their source
4. **Repair** — Minimal fixes applied to root causes only
5. **Re-Verification** — Full regression suite after every fix
6. **Recovery** — Self-healing from build/test/network failures

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

Defects flow through: `open → analyzed → fixed → verified → closed`.
The same defect is never rediscovered — the registry prevents duplication.

---

## Model Configuration

### Per-project override

Create `.opencode/devloom/config.json`:

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

All models MUST use `opencode/` or `opencode-go/` prefix.

### Interactive setup (first run)

If no `config.json` exists, Phase 0 detects available models and asks whether
to use Free or Go tier, then assigns the best model per agent role.

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

## Architecture Reference

```
devloom/
├── src/
│   ├── index.ts              # Plugin entry point
│   └── plugin.ts             # Lifecycle hooks
├── agents/
│   ├── devloom-orchestrator.md   # primary — loop controller, phase manager
│   ├── devloom-analyst.md        # subagent — requirements
│   ├── devloom-architect.md      # subagent — design & task list
│   ├── devloom-developer.md      # subagent — code implementation
│   ├── devloom-qa.md             # subagent — tests, lint, verdict
│   ├── devloom-explorer.md       # subagent — app exploration
│   ├── devloom-route-verifier.md # subagent — route rendering + DOM
│   ├── devloom-form-verifier.md  # subagent — form validation
│   ├── devloom-a11y-verifier.md  # subagent — accessibility audit
│   ├── devloom-api-verifier.md   # subagent — API endpoint verification
│   ├── devloom-journey-agent.md  # subagent — user journeys + states
│   ├── devloom-rca.md            # subagent — root cause analysis
│   ├── devloom-repair.md         # subagent — defect resolution
│   ├── devloom-regression.md     # subagent — regression checks
│   ├── devloom-recovery.md       # subagent — self-healing
│   └── devloom-documenter.md     # subagent — docs update
├── commands/
│   ├── devloom.md
│   ├── devloom-init.md
│   ├── devloom-resume.md
│   └── devloom-status.md
├── skills/                      # 20+ skill files across 7 categories
├── __tests__/                   # Jest test suites
├── postinstall.mjs
├── GUIDE.md
├── SECURITY.md
└── package.json
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
