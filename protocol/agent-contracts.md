# Agent Contracts

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/workflow.dsl|~/.config/opencode/devloom-ai/verify.dsl

FMT:
`Agent|Purpose|In|Out|Rules|Signal`

AGENTS:
- Orchestrator|run phases+queue|prompt|state+handoffs|EN|SingleActive|PersistAll|LoadMemory|UseSkills|AppendPromptTask|MaintainPlan|DEVLOOM_DONE
- Analyst|prompt->requirements|prompt|REQ|NoImpl|NoSpeculation|KeepConstraints|ANALYST_COMPLETE
- Architect|requirements->plan+tickets|REQ|PLAN+tasks/*|LatestStableCheck|OfficialDocsFirst|TestsInPlan|ARCHITECT_COMPLETE
- Developer|implement one ticket|ticket+PLAN|code+tests|TDDReq|NoScopeCreep|MinChange|DEVELOPER_COMPLETE
- QA|verify one ticket|ticket+diff|results|Lint|Tests|Regr|QA_PASS/QA_FAIL
- Explorer|discover app surface|app url/cmd|exploration report|VisitAll|NoGuess|EXPLORER_COMPLETE
- RouteVerifier|verify routes|routes|route defects|ROUTE checks|ROUTE_VERIFIER_COMPLETE
- FormVerifier|verify forms|forms|form defects|FORM checks|FORM_VERIFIER_COMPLETE
- A11yVerifier|verify accessibility|pages|a11y defects|A11Y checks|A11Y_VERIFIER_COMPLETE
- ApiVerifier|verify endpoints|api/app|api report|API checks|API_VERIFIER_COMPLETE
- JourneyAgent|run user flows|REQ+exploration|journey report|JOURNEY checks|JOURNEY_AGENT_COMPLETE
- RCA|find root cause|defect+files|cause+fix plan|NoGuess|Symptom!=Fix|RCA_COMPLETE
- Repair|apply minimal fix|RCA|code+tests|FixRootOnly|REPAIR_COMPLETE
- Regression|check impact|changed files|results|TargetedFirst|FullGateBeforeDone|REGRESSION_PASS/REGRESSION_FAIL
- Recovery|recover autonomous failure|phase+error|recovery result|Max3Hyp|EscalateLast|RECOVERY_DONE
- Documenter|update docs+state|done tasks|docs+state|OnlyImplemented|EN|DOCUMENTER_COMPLETE

SHARED:
- EN
- DeltaCommOnly
- JSONM for AI-only state
- Update BOARD+PSTATE on ticket state change
- Append each prompt to project/tasks/TODO.md before execution routing
- Keep tasks/todos/plan aligned with the active ticket
- DevLoom subagents are callable by the orchestrator and may also be invoked manually by the user
- OfficialDocsFirst for stack-specific decisions
- LatestStableCheck before stack-specific planning/coding
