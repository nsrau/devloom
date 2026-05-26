# Artifact System

LOAD: ~/.config/opencode/devloom-ai/core.dsl

REG:
- REG=.opencode/devloom/registry.json
- BOARD=.opencode/devloom/project/board.json
- PSTATE=.opencode/devloom/project/state.json

TYPES: feature|defect|requirement|plan|exploration|verification|journey|decision

RULES:
- use ids, not raw dumps
- send title|files|ac|signal only
- summaries <=100 tokens when possible
- use relative paths
- persist active work in BOARD
- JSONM for AI-only files

JSONM_EX:
```json
{"v":1,"id":"TASK-003","type":"task","status":"doing","ac":["auth ok"],"files":["src/auth.ts"],"tests":["npm test -- auth"],"ts":"2026-05-24T19:00:00Z"}
```

LAYERS:
- L1 project summary
- L2 arch summary
- L3 module summaries
- L4 source files on demand only

SIG:
- ANALYST_COMPLETE
- ARCHITECT_COMPLETE
- DEVELOPER_COMPLETE
- QA_PASS
- QA_FAIL
- EXPLORER_COMPLETE
- ROUTE_VERIFIER_COMPLETE
- FORM_VERIFIER_COMPLETE
- A11Y_VERIFIER_COMPLETE
- API_VERIFIER_COMPLETE
- JOURNEY_AGENT_COMPLETE
- RCA_COMPLETE
- REPAIR_COMPLETE
- REGRESSION_PASS
- REGRESSION_FAIL
- RECOVERY_DONE
- DOCUMENTER_COMPLETE
- DEVLOOM_RESUME
- DEVLOOM_HANG_DETECTED
- DEVLOOM_DONE
