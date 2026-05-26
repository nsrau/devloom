---
name: documentation
description: Update docs and decision records for completed work.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl
DO:
- document implemented behavior only
- update setup/usage/api notes if changed
- persist state/report deltas
RULES: EN|NoSpeculation|WhyOverWhat
