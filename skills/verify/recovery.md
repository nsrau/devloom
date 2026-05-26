---
name: recovery
description: Recover from execution failures with bounded retries.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl
FLOW: inspect>hypothesize<=3>retry>escalateLast
RULES: AutonomousFirst|NoInfiniteLoop
