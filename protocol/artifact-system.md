# Artifact System

Token-efficient artifact registry for delta-only communication between agents.

## Artifact Registry

Location: `.opencode/devloom/registry.json`

```json
{
  "artifacts": [
    {
      "id": "AUTH-001",
      "type": "feature",
      "summary": "Email/password authentication implemented",
      "status": "completed",
      "files": ["src/auth.service.ts", "src/login.page.tsx"],
      "dependencies": ["DB-002"],
      "updatedAt": "2026-05-24T19:00:00Z"
    }
  ],
  "lastSequence": 42
}
```

### Artifact Types

| Type | Description |
|------|-------------|
| `feature` | Implemented feature |
| `defect` | Discovered defect (moved to defects.json) |
| `requirement` | Requirements artifact (requirements.md) |
| `plan` | Task plan artifact (plan.md) |
| `exploration` | Exploration report |
| `verification` | Verification result |
| `journey` | User journey execution result |
| `decision` | Architecture or design decision |

## Delta Update Protocol

### When communicating between agents:

1. Agent A produces artifact → saves to registry.
2. Agent A signals completion with artifact ID.
3. Agent B reads artifact from registry by ID.
4. Agent B never receives full payload — only the ID + summary.

### Good:

```text
Agent A → B: "Task AUTH-001 complete. Files: auth.service.ts, login.page.tsx. AC: login/logout pass."
Agent B → A: "QA_PASS on AUTH-001."
```

### Bad:

```text
Agent A → B: [entire auth.service.ts source code + conversation history + previous errors]
```

## Summary Format

Every completed task must leave a summary. Max 300 tokens.

```json
{
  "task": "AUTH-001",
  "result": "implemented",
  "files": ["auth.service.ts", "login.page.tsx"],
  "openDefects": [],
  "nextActions": ["DB-002"]
}
```

## Hierarchical Project Memory (4 Layers)

### Layer 1: Project Summary (max 500 tokens)

- Project purpose
- Main features
- Current status (phase + completion %)

### Layer 2: Architecture Summary (max 1000 tokens)

- Architecture decisions
- Technology stack
- Module relationships

### Layer 3: Module Summaries (max 500 tokens each)

- Module responsibilities
- Dependencies
- Current state

### Layer 4: Source Files

- Load only when modification or inspection is required.
- Never load entire repo.

## Completion Signals

Standardized completion signals for all agent handoffs:

| Signal | Meaning |
|--------|---------|
| `ANALYST_COMPLETE` | Requirements done |
| `ARCHITECT_COMPLETE` | Plan created |
| `DEVELOPER_COMPLETE` | Implementation done |
| `QA_PASS` | QA verification passed |
| `QA_FAIL` | QA verification failed |
| `EXPLORER_COMPLETE` | App exploration done |
| `ROUTE_VERIFIER_COMPLETE` | Route verification done |
| `FORM_VERIFIER_COMPLETE` | Form verification done |
| `A11Y_VERIFIER_COMPLETE` | Accessibility verification done |
| `API_VERIFIER_COMPLETE` | API verification done |
| `JOURNEY_AGENT_COMPLETE` | Journey execution done |
| `RCA_COMPLETE` | Root cause analysis done |
| `REPAIR_COMPLETE` | Repair applied |
| `REGRESSION_PASS` | Regression check passed |
| `REGRESSION_FAIL` | Regression check failed |
| `RECOVERY_DONE` | Recovery handled |
| `DOCUMENTER_COMPLETE` | Documentation updated |
| `DEVLOOM_DONE` | All gates passed, delivery complete |
| `DEVLOOM_HANG_DETECTED` | Anti-hang triggered, diagnostic produced |
| `DEVLOOM_RESUME` | Session resumed from state |

## Token Budget System

| Agent | Max Tokens Per Invocation |
|-------|--------------------------|
| Orchestrator | 2000 (prompts to sub-agents are compressed) |
| Analyst | 1500 |
| Architect | 2000 |
| Developer | 3000 |
| QA | 2000 |
| Explorer | 4000 |
| Route Verifier | 3000 |
| Form Verifier | 3000 |
| A11y Verifier | 3000 |
| API Verifier | 4000 |
| Journey Agent | 4000 |
| RCA | 2000 |
| Repair | 3000 |
| Regression | 2000 |
| Recovery | 3000 |
| Documenter | 2000 |

## Artifact Referencing Rules

1. Always reference artifacts by ID, not by re-sending content.
2. When requesting work from a sub-agent, send only: task title, files to modify, AC, expected signal.
3. When reporting results, send only: artifact ID, summary (≤100 tokens), completion signal.
4. Defect references: use `BUG-NNN` format from defect registry.
5. File references: use relative paths from project root.
