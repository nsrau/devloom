LOAD_ORDER:
- detect domain
- load matching skills
- always apply core flow
MAP:
- FE=frontend-development
- BE=backend-development|api-design
- API=api-design
- TEST=test-driven-development|quality-assurance
- SEC=security-review
- PERF=performance-review
- BUG=debugging
- DOC=documentation
- REQ=requirements-analysis
- PLAN=architecture-planning
- EXP=application-exploration
- ROUTE=route-verification
- FORM=form-verification
- DOM=dom-inspection
- A11Y=accessibility-verification
- APIV=api-verification|contract-validation
- JOURNEY=user-journey-generation|state-exploration
- RCA=root-cause-analysis
- FIX=repair|regression-verification|recovery
MATCH:
- ui|react|vue|angular|css|html|component|layout=>FE
- api|endpoint|service|route|graphql|rest=>BE|API
- test|spec|jest|vitest|pytest|e2e=>TEST
- auth|secret|cors|xss|csrf|owasp=>SEC
- perf|slow|cache|bundle|lcp=>PERF
- bug|error|fail|crash|broken=>BUG
- readme|docs|adr|comment=>DOC
REPORT: ActivatedSkills=<list>
