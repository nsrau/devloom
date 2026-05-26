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
RULES:
- EnglishOnly
- SingleActive
- PersistAll
- NoDropPending
- OfficialDocsFirst
- LatestStableCheck for stack-specific work
- TDDReq for code change
- RegrReq for code change
- NoScopeCreep
- SecureByDefault
- DeltaCommOnly
- ShortStableKeys in JSONM
JSON_KEYS: v|id|type|title|status|ac|deps|files|tests|cols|ts|ctx|next
