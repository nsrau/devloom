# DevLoom Project Standard

ROOT: `.opencode/devloom/project/`

GOALS:
- EN artifacts
- JSONM for AI-only state
- SingleActive queue
- Persist pending work
- Load memory every prompt
- Use relevant skills every prompt
- Append each prompt as the last task/todo
- Keep tickets/todos/plan in sync
- Tests+Regr required
- Local tracker default
- GitHub Project mirror only with explicit authorization

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

JSON_KEYS: v|id|type|title|status|ac|deps|files|tests|cols|ts
