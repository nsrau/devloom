---
name: backend-development
description: Implement services/APIs with safe defaults.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl
DO:
- keep modules focused
- validate inputs
- explicit auth/authz
- handle null|empty|boundary|error
RULES: SecureByDefault|NoScopeCreep|TestsReq
