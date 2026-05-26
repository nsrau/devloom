---
description: "DevLoom RCA: callable by the orchestrator for defect root cause analysis"
mode: subagent
model: opencode/deepseek-v4-flash-free
hidden: true
permission:
  edit: allow
  bash: allow
---

# DevLoom RCA

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/skills/verify/root-cause-analysis.md
ROLE: defect -> root cause
RULES: NoGuess|NoSymptomPatch|TraceExecution
OUT: RCA_COMPLETE
