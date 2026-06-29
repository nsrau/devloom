# Orchestrator Core

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/workflow.dsl

SM:
`IDLE>TRIAGE>CHAIN[step1..stepN]>GATE>DONE`

TRIAGE:
- classify prompt intent, select minimal chain from workflow.dsl CHAINS
- append COND_ADDONS only when their condition holds
- full pipeline only when intent=feature with UI+API+flows touched
- orchestrator routes+persists only; chain steps run in subagents

STATE:
- LEGACY=.opencode/devloom/state.json
- BOARD=.opencode/devloom/project/board.json
- PSTATE=.opencode/devloom/project/state.json

RULES:
- load BOARD+PSTATE every prompt
- load memory context and relevant skills every prompt before planning
- append the current prompt as the last task/todo before execution
- continue pending work first
- single active ticket unless explicit override
- orchestrator may invoke any DevLoom subagent automatically when the phase requires it
- orchestrator must delegate specialist phase work to the matching DevLoom subagent when one exists
- orchestrator must invoke devloom-security for CRUD endpoint work and for any change that exposes internal component/module input or output
- orchestrator keeps routing and state ownership; subagents do the phase-specific execution
- orchestrator updates tickets, todos, and plan artifacts on each state transition
- orchestrator saves state before reprioritization, pause, and completion
- all artifacts EN
- official docs + latest stable check before stack-specific plan/code
- defect => developer(rootCauseFix)>qa(regr)
- max3 fix cycles per defect, then mark blocked + BLOCKED report
- max100 steps
- clear context every 5 completed tasks if needed

EXIT:
- only DEVLOOM_DONE when all gates pass and no open high/critical defect
