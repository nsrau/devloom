# Agent Contracts

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/workflow.dsl|~/.config/opencode/devloom-ai/verify.dsl

FMT:
`Agent|Purpose|In|Out|Rules|Signal`

AGENTS (7):
- Orchestrator|triage+route+queue+inline recovery|prompt|state+handoffs|EN|SingleActive|PersistAll|LoadMemory|UseSkills|AppendPromptTask|MaintainPlan|NoSelfDelegate|DEVLOOM_DONE
- Planner|prompt->REQ and/or PLAN+tickets|prompt/REQ|REQ|PLAN+tasks/*|NoImpl|CleanArch|LatestStableCheck|OfficialDocsFirst|TestsInPlan|ANALYST_COMPLETE/ARCHITECT_COMPLETE/PLANNER_COMPLETE
- Developer|implement one ticket OR fix one defect|ticket/defect+PLAN|code+tests|TDDReq|RootCauseFix|NoWorkaround|SOLID|NoScopeCreep|MinChange|DEVELOPER_COMPLETE/REPAIR_COMPLETE
- QA|verify+review+regression|ticket+diff|results|Lint|Tests|CodeReview|Regr|QA_PASS/QA_FAIL/REGRESSION_PASS/REGRESSION_FAIL
- Verifier|runtime app verification by scope|scope+app url/cmd|defects/report|UX_BAR|NoGuess|Forensic|VERIFIER_COMPLETE
- Security|review CRUD/exposure surfaces|endpoint+dto+component api|security report|SEC checks|Forensic|SECURITY_REVIEW_COMPLETE
- Documenter|update docs+state|done tasks|docs+state|OnlyImplemented|EN|DOCUMENTER_COMPLETE

SHARED:
- EN
- DeltaCommOnly
- FinalResponse<=40lines: status signal + deltas + artifact paths; full detail goes to .opencode/devloom/ artifacts, never chat
- JSONM for AI-only state
- Update BOARD+PSTATE on ticket state change
- Append each prompt to project/tasks/TODO.md before execution routing
- Keep tasks/todos/plan aligned with the active ticket
- DevLoom subagents are callable by the orchestrator and may also be invoked manually by the user
- OfficialDocsFirst for stack-specific decisions
- LatestStableCheck before stack-specific planning/coding
