# Project System

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/workflow.dsl

ROOT: `.opencode/devloom/project/`

TREE:
- README.md
- config.json
- board.json
- state.json
- stories/
- tasks/
- bugs/
- decisions/
- reports/

CFG_JSONM:
```json
{"v":1,"lang":"en","tracker":"local","gh":{"enabled":false,"owner":"","repo":"","project":""},"rules":{"flow":["analysis","documentation","implementation","verification","regression","done"],"tests":"required","regression":"required","queue":"single","docs":"official"}}
```

BOARD_JSONM:
```json
{"v":1,"tracker":"local","active":"","cols":{"backlog":[],"ready":[],"doing":[],"review":[],"blocked":[],"done":[]},"updatedAt":""}
```

STATE_JSONM:
```json
{"v":1,"phase":"idle","prompt":"","ticket":"","next":"analysis","updatedAt":"","notes":[]}
```

RULES:
- EN
- JSONM for AI-only state
- doing<=1 unless explicit user override
- never drop pending work
- tests+regr required for code change
- tracker=github only with explicit user authorization
- local files remain fallback source of truth even in github mode
