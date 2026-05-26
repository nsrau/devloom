---
name: api-design
description: Define stable API contracts and boundaries.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/verify.dsl
DO:
- define request|response|errors|auth|paging
- prefer explicit contracts
- align runtime with OpenAPI/spec when present
RULES: StableNames|BackwardCompatByDefault|ValidateInputs
