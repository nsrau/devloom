---
name: loop-constraints
description: Load and validate loop-constraints.md before each tick, build guard string for agent injection.
---
LOAD: ~/.config/opencode/devloom-ai/core.dsl

LOAD_CONSTRAINTS:
- read .opencode/devloom/loop/loop-constraints.md
- parse numbered rules (lines matching /^\d+\.\s/)
- build [loop-constraints] guard string
- inject into agent system prompt before each delegation

DEFAULT_RULES:
- run tests before any commit
- never push without human review on denylisted paths
- pause if daily token budget exceeded
- L1 level: report-only, no source code edits
- all loop agents must log outcomes to run-log.json

OUT: constraints guard string injected into agent system prompt
CHK: rules parsed correctly | guard string non-empty or empty gracefully
