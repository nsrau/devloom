---
name: application-exploration
description: Discover routes, ui, and interaction surface.
---

LOAD: ~/.config/opencode/devloom-ai/verify.dsl
DO:
- visit all reachable routes
- enumerate buttons|links|forms|modals|tables
- keep exploring until no new elements
OUT: exploration-report.json
