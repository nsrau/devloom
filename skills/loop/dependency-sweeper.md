---
name: loop-dependency-sweeper
description: Scan and patch outdated dependencies (L2 — patch-only auto-updates, minor/major reported).
---
LOAD: ~/.config/opencode/devloom-ai/core.dsl

SCAN:
- run npm outdated to list outdated packages
- categorize updates: patch (safe), minor (report), major (report)
- check vulnerabilities: npm audit

UPDATE_RULES:
- patch updates (1.2.3 → 1.2.4): auto-apply
- minor updates (1.2.3 → 1.3.0): log to report, no apply
- major updates (1.2.3 → 2.0.0): log to report, no apply
- vulnerability fixes: apply regardless of semver if patch available

VERIFY:
- run full test suite after each patch batch
- log updated packages to run-log.json
- report non-patch updates to .opencode/devloom/reports/deps-YYYY-MM-DD.md

OUT: patches applied | deps report written | run-log updated
CHK: test suite passes | only patch auto-applied | vulnerabilities fixed
