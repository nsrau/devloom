---
id: design-audit
cadence: "on-demand"
level: L1
agents: [verifier]
cost: 200000
description: "Comprehensive UI/UX + functional audit with automated fix loop — covers visual inconsistencies, broken actions, missing actions, dead-end flows, API mismatches"
---
# Design Audit Pattern

## Purpose
Run exhaustive UI/UX + FUNCTIONAL audits across target pages. Two modes: AUDIT (L1, report-only) catalogs both visual and functional issues; FIX (L2, worktree+verifier) applies unified design system + functional fixes, looping until all items verified.

## State Schema
```json
{
  "audit": {
    "urls": ["https://..."],
    "reportPath": ".opencode/devloom/reports/design-audit-YYYY-MM-DD.md",
    "issueCount": number,
    "categories": { "ui": N, "functional": N, "missing-action": N, "broken-action": N, "api": N, "state": N },
    "designSystemSpecPath": ".opencode/devloom/reports/design-system-spec.md"
  },
  "fix": {
    "progress": {
      "items": [{ "id": "...", "status": "...", "category": "ui|functional|missing-action|broken-action|api|state", "severity": "critical|high|medium|low" }],
      "completionCondition": "All items verified against design system + functional contract",
      "total": number, "done": number, "verified": number
    }
  }
}
```

## Modes

### AUDIT (L1 — report only)
Analyze every page exhaustively. Catalog BOTH:
- **UI**: buttons, modals, forms, tables, tabs, colors, spacing, typography, icons, loading/error/empty states, navigation, layout, responsiveness
- **Functional**: broken buttons, broken links, missing CRUD, missing validations, missing feedback, dead-end flows, API errors, state issues

Produce unified design system spec + functional contract. Tag each issue with category + severity. No source code edits.

### FIX (L2 — worktree + verifier, run-until-done)
Apply unified design system + functional fixes item-by-item in worktrees. Priority: critical → high → medium → low. Loop until all items verified.

## Agent Chain
- **AUDIT**: verifier (crawl + catalog + report)
- **FIX**: developer (implement per-item in worktree) → verifier (verify item matches spec + functional contract)

## Safety
- L1: no source files modified, no code edits
- L2: all changes in worktrees, each item verified before proceeding
- Max retries per item: 3
- Budget exhaustion → pause, logs partial progress

## Prompt Template (AUDIT)
"Run design-audit in audit mode. Analyze all pages at {URLs}. For each page: (1) catalog every UI element — buttons, links, inputs, modals, forms, tables, tabs, navigation, colors, spacing, typography, icons, loading/error/empty states; (2) test every functional action — click each button, submit each form, follow each link, switch each tab, verify each API call has error handling, check for missing CRUD/validations/feedback, find dead-end flows and state issues. Tag each issue with category (ui|functional|missing-action|broken-action|api|state) and severity (critical|high|medium|low). Write audit report to .opencode/devloom/reports/design-audit-{DATE}.md and unified spec to .opencode/devloom/reports/design-system-spec.md. L1: do not edit any source code."

## Prompt Template (FIX)
"Run design-audit in fix mode. Read progress from .opencode/devloom/loop/progress.json. Pick next un-verified item (ordered by severity). Apply the design system spec + functional contract from .opencode/devloom/reports/design-system-spec.md in a worktree (branch: devloom/design-audit/{PAGE}). Fix both UI inconsistencies and functional issues (broken actions, missing handlers, missing validations, dead-end flows, API errors, state problems). Verify the item matches spec + functional contract. If verified, mark progress. Repeat until all items verified or budget exhausted."

## Token Cost Estimate
~200K tokens per tick (verifier for audit; developer+verifier for fix).
