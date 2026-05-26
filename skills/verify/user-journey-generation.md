---
name: user-journey-generation
description: Generate and run user journeys.
---

LOAD: ~/.config/opencode/devloom-ai/verify.dsl
DO:
- derive journeys from REQ+routes+ui
- cover CRUD|LoginFlow|SearchFilterSort|ErrorRecovery
