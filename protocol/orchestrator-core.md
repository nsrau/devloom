# Orchestrator Core

Token-efficient lifecycle state machine for autonomous software delivery.

## State Machine

```
IDLE → PHASE_0 → PHASE_1 → PHASE_2 → PHASE_3 → PHASE_4 → PHASE_5 → PHASE_6 → PHASE_7 → PHASE_8 → DONE
  ↑         ↑                                                                                        |
  |         └── RESUME ──→ (skip completed phases)                                                   |
  └────────────────────────────── REPAIR_LOOP ───────────────────────────────────────────────────────┘
```

### Phase Transitions

| Phase | Name | Entry | Exit Signal |
|-------|------|-------|-------------|
| 0 | Model Setup | config check / interactive | PHASE_0_DONE |
| 1 | Understand & Plan | requirements analysis | PHASE_1_DONE |
| 2 | Implementation & QA | task execution loop | PHASE_2_DONE |
| 3 | Application Exploration | start app, explore | PHASE_3_DONE |
| 4 | Route/Form/UI/A11y Verification | verify discovered elements | PHASE_4_DONE |
| 5 | API Verification & Contract | verify endpoints | PHASE_5_DONE |
| 6 | User Journeys & States | generate & execute journeys | PHASE_6_DONE |
| 7 | Cross-Cutting Verification | perf, security, a11y (deep) | PHASE_7_DONE |
| 8 | Acceptance Validation | run full gate | DEVLOOM_DONE |

### Transition Rules

1. Phase N can only advance to N+1 after exit signal.
2. Any phase can route to REPAIR_LOOP if defects found.
3. REPAIR_LOOP returns to the phase that triggered it.
4. Phase 8 cannot exit until all 17 gates pass.
5. On RESUME: read `.opencode/devloom/state.json`, skip completed phases.

## Acceptance Gate

All 17 criteria must pass before DEVLOOM_DONE:

```yaml
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

## Loop Control

### Main Loop: Verify → Repair → Re-Verify

```
implement → verify → [pass?] → next task
                    → [fail?] → RCA → repair → re-verify → [pass?] → next task
                                                          → [fail?] → max 3 cycles → escalate
```

### Rules

- Max 3 repair cycles per defect.
- After 3: mark defect `escalated` in registry, skip task.
- Same defect must not be rediscovered — check registry before logging new defects.
- No task retried > 3 times. Always move forward after 3 failures.

## Anti-Hang Safeguards

- Global step counter: 100 max.
- If > 50 steps without defect status change → `DEVLOOM_HANG_DETECTED` + diagnostic.
- Every 5 completed tasks → emit `/clear` to reset context window.
- No phase retried > 3 times.

## Token Efficiency Rules

1. All prompts to sub-agents MUST use compressed format: task title, files, AC, signal. No filler.
2. Never load full files unless modification/inspection is required.
3. Use artifact references instead of re-transmitting data.
4. Read summaries before loading raw data.
5. Never exchange entire conversation or repository history.

## State Persistence

File: `.opencode/devloom/state.json`

```json
{
  "phase": "3/8",
  "completedPhases": [0, 1, 2],
  "tasks": { "total": 10, "completed": ["AUTH-001", "DB-002"] },
  "defects": { "open": 1, "fixed": 0, "escalated": 0 },
  "lastUpdated": "2026-05-24T19:00:00Z"
}
```

## Used By

- `agents/devloom-orchestrator.md` — references this module for state machine rules
- `commands/devloom.md` — entry point triggers lifecycle
- `agents/devloom-recovery.md` — reads phase state for recovery targeting
