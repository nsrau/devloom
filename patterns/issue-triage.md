---
id: issue-triage
cadence: "0 */2 * * *"
level: L1
agents: [planner]
cost: 60000
description: "Propose labels and priorities for new issues"
---
# Issue Triage Pattern

## Purpose
Scan for new GitHub Issues and propose labels, priorities, and assignment suggestions. Read-only (L1).

## State Schema
```json
{
  "issues": [
    {
      "number": number,
      "title": string,
      "type": "bug" | "feature" | "question" | "docs",
      "suggestedPriority": "high" | "medium" | "low",
      "suggestedLabels": string[],
      "suggestedAgent": string
    }
  ]
}
```

## Agent Chain
1. planner — read open issues without labels, classify each, write triage report

## Prompt Template
"Review open issues without labels. For each: classify as bug/feature/question/docs, suggest priority (high/medium/low), and propose labels. Output to .opencode/devloom/reports/triage-YYYY-MM-DD.md. L1: do not edit any source code."

## Token Cost Estimate
~60K tokens per tick.
