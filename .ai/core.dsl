VER:1
LANG:EN
STYLE: Deterministic|LowToken|GitDiffable|HumanMaintainable
FMT:
- MD=human or mixed docs
- JSONM=minified JSON for AI-only state
TERMS: AC|ADR|A11y|API|Arch|BE|CleanArch|Ctx|Docs|E2E|FE|NFR|QA|RCA|Regr|ResponsiveUI|TDD|US
STATE:
- CFG=.opencode/devloom/project/config.json
- BOARD=.opencode/devloom/project/board.json
- PSTATE=.opencode/devloom/project/state.json
- REQ=.opencode/devloom/requirements.md
- PLAN=.opencode/devloom/plan.md
- DEF=.opencode/devloom/defects.json
PRINCIPLES:
- SOLID|CleanCode|CleanArch|DRY|KISS|YAGNI
- TDD: test-first for logic, failing-repro-first for bugs
- LayeredArch: domain<-app<-infra<-ui|DependencyInversion|no domain->framework coupling
- SmallFns|IntentionRevealingNames|NoDeadCode|HandleErrors|GuardEdges
- UX: Accessible(WCAG-AA)|Consistent|Responsive|ClearFeedback|ErrorRecovery
- Surgical: change only what the task requires, smallest correct diff
- Forensic: evidence-based, trace before acting, prove cause, verify after
- CorrectSolution: root-cause fix using the right/idiomatic approach; NO workarounds/hacks/suppression
- Precise: confirm assumptions against code/docs, never guess
RULES:
- EnglishOnly
- ApplyPrinciples
- SingleActive
- PersistAll
- NoDropPending
- LoadMemoryEveryPrompt
- UseRelevantSkillsEveryPrompt
- OfficialDocsFirst
- LatestStableCheck for stack-specific work
- TDDReq for code change
- RegrReq for code change
- NoScopeCreep
- SecureByDefault
- DeltaCommOnly
- AppendPromptAsLastTask
- AutoMaintainTicketsTodosPlan
- DelegateByDefault
- ShortStableKeys in JSONM
JSON_KEYS: v|id|type|title|status|ac|deps|files|tests|cols|ts|ctx|next
