---
name: loop-issue-triage
description: Triage new issues with labels and priority. L1 read-only.
---
LOAD: ~/.config/opencode/devloom-ai/core.dsl

TRIAGE:
- list open issues without labels: gh issue list --state open --limit 20
- for each issue, read title and body

CLASSIFY:
- Bug: unexpected behavior, crash, error message
- Feature: new capability request
- Question: how-to, configuration help
- Docs: documentation gap or error

ASSIGN_PRIORITY:
- High: security, data loss, production blocker
- Medium: feature request, non-critical bug
- Low: cosmetic, nice-to-have, question

REPORT:
- write to .opencode/devloom/reports/triage-YYYY-MM-DD.md
- per issue: #N: [type] priority=priority suggested_labels=[...]

OUT: .opencode/devloom/reports/triage-YYYY-MM-DD.md
CHK: all unlabeled issues processed | classification correct | report written
