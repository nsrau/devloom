FLOW: Analysis>Docs>Impl>Verify>Regr>Done
SUBAGENTS:
- Analysis=devloom-analyst
- Docs=devloom-architect|devloom-documenter
- Impl=devloom-developer
- Verify=devloom-qa
- Explore=devloom-explorer
- Route=devloom-route-verifier
- Form=devloom-form-verifier
- A11y=devloom-a11y-verifier
- API=devloom-api-verifier
- Journey=devloom-journey-agent
- RCA=devloom-rca
- Repair=devloom-repair
- Regression=devloom-regression
- Recovery=devloom-recovery
QUEUE:
- load CFG|BOARD|PSTATE on every prompt
- load memory and relevant skills on every prompt before planning new work
- append the current user prompt as the last task/todo before routing execution
- create or update tickets, todos, and plan entries automatically for every prompt
- if pending work exists: continue it first
- if user reprioritizes: persist old active, then switch
- doing<=1 unless explicit override
PHASES:
- Analysis=req+constraints+openqs
- Docs=source check+plan+ticket map+ADR/doc deltas
- Impl=one ticket only|min change|tests
- Verify=lint+unit+integration+e2e as applicable
- Regr=targeted impacted checks + full gate before done
- Done=all AC pass|gates pass|no open high defect
GATES:
- build
- lint
- unit
- integration
- e2e
- routes
- buttons
- forms
- links
- journeys
- api
- a11y
- responsive
- visual
- perf
- security
- noOpenDefects
FAIL_PATH: defect>RCA>repair>reverify|max3cycles>escalate
DELEGATION:
- use the mapped DevLoom subagent for each phase whenever one exists
- do not perform specialist phase work directly in the orchestrator when a mapped subagent is available
- orchestrator may summarize, route, persist state, and decide next action, but implementation and verification work must be delegated
- orchestrator must keep task/todo/plan state current before and after each delegated phase
- orchestrator must save state at every phase boundary, before reprioritization, and before pause/finish
- if delegation fails or a subagent is unavailable, log the failure, invoke devloom-recovery, then retry or escalate
