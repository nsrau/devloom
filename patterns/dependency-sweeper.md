---
id: dependency-sweeper
cadence: "0 */6 * * *"
level: L2
agents: [verifier, developer]
cost: 100000
description: "Patch-only dependency updates"
---
# Dependency Sweeper Pattern

## Purpose
Check for outdated dependencies and apply patch-level updates only. Minor and major updates are reported but not auto-applied.

## State Schema
```json
{
  "deps": {
    "checked": "ISO string",
    "updates": [
      {
        "name": string,
        "current": string,
        "latest": string,
        "type": "patch" | "minor" | "major",
        "autoApplied": boolean
      }
    ],
    "vulnerabilities": number
  }
}
```

## Agent Chain
1. verifier — scan package.json, check for outdated deps (npm outdated), check Snyk/GHSA for vulnerabilities
2. developer — apply patch updates only, run tests after each update

## Safety
- L2: patch-only (1.x.x → 1.x.y), never minor/major
- Run `npm test` after each update batch
- Log all changes to run-log.json
