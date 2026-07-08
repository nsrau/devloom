---
name: loop-changelog-drafter
description: Draft release notes from commits since last tag. L1 read-only.
---
LOAD: ~/.config/opencode/devloom-ai/core.dsl

DRAFT:
- find last release tag: git describe --tags --abbrev=0
- get commits since tag: git log --oneline <tag>..HEAD
- categorize by conventional commit prefix:
  - feat: → Features
  - fix: → Bug Fixes
  - docs: → Documentation
  - chore: → Chores/Maintenance
  - refactor: → Refactoring
  - test: → Testing

OUTPUT:
- write draft to .opencode/devloom/reports/changelog-YYYY-MM-DD.md
- format per template below

```markdown
# Changelog DRAFT YYYY-MM-DD
## Features
- commit messages...
## Bug Fixes
- ...
## Chores
- ...
```
OUT: .opencode/devloom/reports/changelog-YYYY-MM-DD.md
CHK: commits categorized correctly | tag found | report written
