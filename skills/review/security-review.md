---
name: security-review
description: Security checks for app and code changes.
---

LOAD: ~/.config/opencode/devloom-ai/verify.dsl
CHECK: depAudit|noSecrets|auth|authz|cors|sanitize|leastPrivilege
