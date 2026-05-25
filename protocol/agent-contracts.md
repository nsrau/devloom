# Agent Contracts

Typed interfaces for every DevLoom agent. Defines input, output, constraints, and token limits.

## Contract Format

```text
Agent: <name>
Purpose: <single responsibility statement>
Input: artifact IDs or task reference
Output: structured artifact
Constraints: token limit, no raw dumps, no conversation exchange
Signal: completion signal value
```

---

## Analyst

| Field | Value |
|-------|-------|
| Purpose | Analyze user prompt, produce structured requirements |
| Input | User prompt (or resume state) |
| Output | `.opencode/devloom/requirements.md` |
| Constraints | Max 1500 tokens. No speculative features. No implementation details. |
| Signal | `ANALYST_COMPLETE` |

## Architect

| Field | Value |
|-------|-------|
| Purpose | Convert requirements into ordered task plan |
| Input | Artifact: `requirements.md` |
| Output | `.opencode/devloom/plan.md` with ordered `- [ ]` tasks |
| Constraints | Max 2000 tokens. Each task must have files + AC. No implementation code. |
| Signal | `ARCHITECT_COMPLETE` |

## Developer

| Field | Value |
|-------|-------|
| Purpose | Implement a single task from the plan |
| Input | Task reference (title, files, AC from plan) |
| Output | Modified source files |
| Constraints | Max 3000 tokens. Implement only the assigned task. No scope creep. No refactoring of unrelated code. |
| Signal | `DEVELOPER_COMPLETE` |

## QA

| Field | Value |
|-------|-------|
| Purpose | Verify implementation meets AC, run tests, lint |
| Input | Task reference (files changed, AC) |
| Output | Test/lint results + pass/fail verdict |
| Constraints | Max 2000 tokens. Run actual tests and lint. No manual verification. |
| Signal | `QA_PASS` or `QA_FAIL` |

## Explorer

| Field | Value |
|-------|-------|
| Purpose | Discover all interactive elements in the running application |
| Input | App URL or start command |
| Output | `.opencode/devloom/exploration-report.json` |
| Constraints | Max 4000 tokens. Must interact with every discovered element. Continue until no new elements found. No speculative reporting. |
| Signal | `EXPLORER_COMPLETE` |

## Route Verifier

| Field | Value |
|-------|-------|
| Purpose | Verify every discovered route renders correctly |
| Input | Artifact: `exploration-report.json` (routes) |
| Output | Defect reports + verification result |
| Constraints | Max 3000 tokens. Check rendering, errors, navigation, hydration. No blind passes. |
| Signal | `ROUTE_VERIFIER_COMPLETE` |

## Form Verifier

| Field | Value |
|-------|-------|
| Purpose | Test every discovered form for valid/invalid/edge behavior |
| Input | Artifact: `exploration-report.json` (forms) |
| Output | Defect reports + verification result |
| Constraints | Max 3000 tokens. Test valid, invalid, required, boundary. Report actual behavior. |
| Signal | `FORM_VERIFIER_COMPLETE` |

## A11y Verifier

| Field | Value |
|-------|-------|
| Purpose | Audit accessibility of every page |
| Input | Artifact: `exploration-report.json` (pages) |
| Output | Defect reports + verification result |
| Constraints | Max 3000 tokens. Check ARIA, focus, keyboard nav, contrast, semantic HTML. |
| Signal | `A11Y_VERIFIER_COMPLETE` |

## API Verifier

| Field | Value |
|-------|-------|
| Purpose | Discover and verify all API endpoints |
| Input | App URL or base endpoint |
| Output | `.opencode/devloom/api-verification.json` + defect reports |
| Constraints | Max 4000 tokens. Check auth, validation, schemas, status codes, errors. Generate OpenAPI if missing. |
| Signal | `API_VERIFIER_COMPLETE` |

## Journey Agent

| Field | Value |
|-------|-------|
| Purpose | Generate and execute user journeys automatically |
| Input | Artifacts: `requirements.md`, `exploration-report.json` |
| Output | Journey execution results + defect reports |
| Constraints | Max 4000 tokens. Generate journeys from requirements + app structure. Execute every journey. No skipped paths. |
| Signal | `JOURNEY_AGENT_COMPLETE` |

## RCA (Root Cause Analysis)

| Field | Value |
|-------|-------|
| Purpose | Identify root cause of a verified defect |
| Input | Defect registry entry + relevant source files |
| Output | Updated defect entry with root cause + repair strategy |
| Constraints | Max 2000 tokens. Trace actual execution flow. Never guess. Never fix symptoms. |
| Signal | `RCA_COMPLETE` |

## Repair

| Field | Value |
|-------|-------|
| Purpose | Apply minimal fix targeting confirmed root cause |
| Input | RCA artifact (defect with root cause + strategy) |
| Output | Modified source files + updated defect registry entry |
| Constraints | Max 3000 tokens. Fix only the root cause. No new features. No refactoring. Run failing test after fix. |
| Signal | `REPAIR_COMPLETE` |

## Regression

| Field | Value |
|-------|-------|
| Purpose | Verify repair did not break existing functionality |
| Input | Changed files list + impacted areas |
| Output | Test results + pass/fail verdict |
| Constraints | Max 2000 tokens. Run targeted verification first, full coverage before acceptance. |
| Signal | `REGRESSION_PASS` or `REGRESSION_FAIL` |

## Recovery

| Field | Value |
|-------|-------|
| Purpose | Recover from agent/gate failures autonomously |
| Input | Failure context (phase, error, logs) |
| Output | Recovery verdict (fixed, escalated, or requires human) |
| Constraints | Max 3000 tokens. Max 3 hypotheses. Always move forward after 3. Never ask user unless all paths exhausted. |
| Signal | `RECOVERY_DONE` |

## Documenter

| Field | Value |
|-------|-------|
| Purpose | Update documentation based on completed work |
| Input | Completed task list + implementation summary |
| Output | Updated documentation files |
| Constraints | Max 2000 tokens. Only document what was implemented. No speculative docs. |
| Signal | `DOCUMENTER_COMPLETE` |

---

## Shared Constraints (All Agents)

1. **No raw dumps**: never transmit full files unless modification is required.
2. **No conversation history**: never include previous messages in output.
3. **Artifact references only**: use artifact IDs, not re-transmitted content.
4. **Token budget**: respect per-agent token limits.
5. **Completion signal**: always end with the defined signal value.
