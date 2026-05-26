---
name: api-verification
description: Verify endpoint behavior and contracts.
---

LOAD: ~/.config/opencode/devloom-ai/verify.dsl
CHECK: auth|authz|inputVal|outputSchema|statusCodes|errorShape|paging/filter/sort
