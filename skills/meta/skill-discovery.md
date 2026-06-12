---
name: skill-discovery
description: Detect task domain and load the right DevLoom skill set.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/workflow.dsl|~/.config/opencode/devloom-ai/skills.dsl
DO:
- detect domain keywords
- load all matching skills
- enforce core flow: Triage>MinimalChain>Verify>Regr>Done
- require OfficialDocsFirst + LatestStableCheck for stack-specific work
OUT: ActivatedSkills=<list>
