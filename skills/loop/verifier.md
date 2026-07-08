---
name: loop-verifier
description: Verify loop tick output before it takes effect — validate agent chain completion, output paths, run-log integrity, and safety level compliance.
---
LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/verify.dsl

VERIFY:
- check pattern agent chain completed without errors
- verify all outputs written to correct paths
- confirm run-log.json entry matches actual outcome
- L2: was the fix made in a worktree? Was verifier review done?
- L1: were any source files modified? (must be zero)

REJECT:
- L1 tick modifying source files → reject, log as failure
- L2 tick without worktree → reject, log as failure
- test suite failing after changes → reject, log as failure
- budget exceeded mid-tick → partial outcome, pause loop

CHK: all verify checks pass | rejection reasons logged | run-log updated
