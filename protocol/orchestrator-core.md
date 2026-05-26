# Orchestrator Core

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/workflow.dsl

SM:
`IDLE>PHASE0>PHASE1>PHASE2>PHASE3>PHASE4>PHASE5>PHASE6>PHASE7>PHASE8>DONE`

PHASE_MAP:
- 0=model setup
- 1=analysis+plan
- 2=impl+qa
- 3=explore
- 4=route|form|ui|a11y verify
- 5=api verify
- 6=journeys|states
- 7=perf|security|deep verify
- 8=full gate

STATE:
- LEGACY=.opencode/devloom/state.json
- BOARD=.opencode/devloom/project/board.json
- PSTATE=.opencode/devloom/project/state.json

RULES:
- load BOARD+PSTATE every prompt
- continue pending work first
- single active ticket unless explicit override
- orchestrator may invoke any DevLoom subagent automatically when the phase requires it
- orchestrator must delegate specialist phase work to the matching DevLoom subagent when one exists
- orchestrator keeps routing and state ownership; subagents do the phase-specific execution
- all artifacts EN
- official docs + latest stable check before stack-specific plan/code
- defect => RCA>repair>reverify
- max3 repair cycles per defect
- max100 steps
- clear context every 5 completed tasks if needed

EXIT:
- only DEVLOOM_DONE when all gates pass and no open high/critical defect
