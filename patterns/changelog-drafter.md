---
id: changelog-drafter
cadence: "0 8 * * *"
level: L1
agents: [documenter]
cost: 30000
description: "Draft release notes from recent commits"
---
# Changelog Drafter Pattern

## Purpose
Scan recent commits and draft release notes. Read-only (L1). Do not edit source code.

## State Schema
```json
{
  "changelog": {
    "since": "ISO string",
    "until": "ISO string",
    "commits": number,
    "categories": {
      "features": string[],
      "fixes": string[],
      "chores": string[]
    },
    "draftPath": string
  }
}
```

## Agent Chain
1. documenter — read git log since last release, categorize commits, write draft

## Prompt Template
"Review commits from {since} to {until}. Categorize into features, fixes, and chores. Draft a changelog entry. L1: do not edit any source code."

## Token Cost Estimate
~30K tokens per tick.
