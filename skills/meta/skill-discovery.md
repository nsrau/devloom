---
name: skill-discovery
description: Detect task domain and load the right DevLoom skill set.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/workflow.dsl|~/.config/opencode/devloom-ai/skills.dsl
SKILLS (one per agent):
- planner=plan/planning
- developer=build/development
- qa=verify/quality-assurance
- verifier=verify/app-verification
- security=review/security-review
- documenter=ship/documentation
DO:
- detect domain keywords
- load the matching agent skill(s)
- enforce core flow: Triage>MinimalChain>Verify>Regr>Done
- require OfficialDocsFirst + LatestStableCheck for stack-specific work
OUT: ActivatedSkills=<list>
