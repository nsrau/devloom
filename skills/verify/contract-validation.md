---
name: contract-validation
description: Compare runtime behavior against API contract.
---

LOAD: ~/.config/opencode/devloom-ai/verify.dsl
DO:
- generate/open OpenAPI when needed
- compare runtime fields/types/status codes to contract
