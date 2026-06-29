FLOW: Triage>MinimalChain>Verify>Regr>Done
TRIAGE: classify intent first|run only matching chain+conditions|never full pipeline by default
CHAINS:
- feature=planner>developer>qa>documenter
- bug=developer(rootCause+fix)>qa(regr)
- refactor=planner(plan)>developer>qa
- small(<=2files,noNewBehavior)=developer>qa
- docsOnly=planner(validate)>documenter
- specOnly=planner(REQ)
- planOnly=planner(PLAN)
- explore=verifier(scope=explore)
- verifyOnly=qa+verifier(applicableScopes)
COND_ADDONS:
- UI=>verifier(scope=route,form,a11y)
- API=>verifier(scope=api,contract)
- CRUD|exposure=>security(mandatory)
- userFlow=>verifier(scope=journey,state)
DEPS:
- developer requires plan for non-trivial work
- documenter only after verified impl
- qa regression always after a defect fix
ANTILOOP:
- no orchestrator self-delegation
- no subagent calls orchestrator
- every orchestrator turn: task()|DEVLOOM_DONE|BLOCKED+reason
- same agent+same input max2 then mark blocked + BLOCKED report (orchestrator handles recovery inline)
SUBAGENTS:
- Plan=devloom-planner
- Impl/Fix=devloom-developer
- Verify/Review/Regr=devloom-qa
- AppVerify=devloom-verifier(scope=explore|route|dom|form|a11y|api|contract|journey|state)
- Security=devloom-security
- Docs=devloom-documenter
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
FAIL_PATH: defect>developer(rootCauseFix)>qa(regr)|max3cycles>mark blocked+escalate
DELEGATION:
- use the mapped DevLoom subagent for each phase whenever one exists
- do not perform specialist phase work directly in the orchestrator when a mapped subagent is available
- run devloom-security whenever work adds/changes CRUD endpoints or exposes internal component/module data through inputs or outputs
- orchestrator may summarize, route, persist state, and decide next action, but implementation and verification work must be delegated
- orchestrator must keep task/todo/plan state current before and after each delegated phase
- orchestrator must save state at every phase boundary, before reprioritization, and before pause/finish
- if delegation fails or a subagent is unavailable, log the failure, retry once with a corrected prompt, then mark blocked and report BLOCKED
