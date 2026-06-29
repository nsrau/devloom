LOAD_ORDER:
- detect domain
- load matching skills
- always apply core flow
MAP:
- REQ|PLAN|FE|BE|API arch=planning
- FE|BE|API impl|BUG|FIX|RCA=development
- TEST|PERF|REVIEW|REGR=quality-assurance
- EXP|ROUTE|FORM|DOM|A11Y|APIV|CONTRACT|JOURNEY|STATE=app-verification
- SEC=security-review
- DOC=documentation
MATCH:
- ui|react|vue|angular|css|html|component|layout=>FE
- api|endpoint|service|route|graphql|rest=>BE|API
- crud|dto|schema|serializer|mapper|expose|exposure|payload|input|output|internal component|internal module=>SEC
- test|spec|jest|vitest|pytest|e2e=>TEST
- auth|secret|cors|xss|csrf|owasp=>SEC
- perf|slow|cache|bundle|lcp=>PERF
- bug|error|fail|crash|broken=>BUG
- readme|docs|adr|comment=>DOC
REPORT: ActivatedSkills=<list>
