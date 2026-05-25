---
name: recovery
description: Autonomous failure recovery for build, migration, dependency, test, and network failures. Self-healing before escalation.
---

# recovery

## Overview
Autonomous failure recovery across the entire delivery pipeline. Handles build failures, migration failures, dependency failures, test failures, model timeouts, and network errors. Always attempts self-recovery before escalating to human intervention.

## When to Use
- A sub-agent fails or returns an error
- A gate condition fails (build, test, lint)
- A network or model timeout occurs
- A migration or dependency operation fails

## Process

### Build Failure Recovery
1. Analyze error: missing module → install it
2. Analyze error: type error → route to RCA
3. Analyze error: module resolution → clean install
4. Analyze error: reference error → clear cache, retry

### Migration Failure Recovery
1. Rollback migration
2. Fix migration file
3. Retry migration

### Dependency Failure Recovery
1. Check lockfile → npm ci
2. Try legacy peer deps
3. Try force install
4. Clean install (rm -rf node_modules)

### Test Failure Recovery
1. Timeout → increase timeout, retry
2. Flaky test → retry once
3. Real failure → route to RCA

### Network/Model Recovery
1. Exponential backoff retry (3 attempts)
2. Check network connectivity
3. Log and continue

## Anti-Rationalization
| Excuse | Counter |
|--------|---------|
| "This error needs a human" | Try recovery first — 80% of errors are self-healable |
| "I'll just ask the user" | Investigate autonomously — that's the policy |
| "I've seen this before, skip it" | Log and retry — patterns change |

## Verification
- Recovery attempt logged to recovery-log.md
- If recovery succeeded: return to calling phase
- If recovery failed: log as escalated, continue pipeline
- Never block the pipeline for a single failure
