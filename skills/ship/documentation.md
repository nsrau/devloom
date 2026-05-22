---
name: documentation
description: Architecture Decision Records, API docs, inline docs, README updates. Document the why.
---

# documentation

## Overview
Update project documentation to accurately reflect all implemented changes. Document the *why* behind decisions, not just the what.

## When to Use
- After implementing features or making changes
- Creating or updating API documentation
- Making architectural decisions

## Process
1. **Review completed tasks**: Check `.opencode/devloom/plan.md` for what was done
2. **Read current docs**: Understand existing documentation structure
3. **Update README**: New features, changed APIs, setup changes, usage examples
4. **Update requirements**: Mark acceptance criteria as satisfied
5. **Add API docs**: If applicable, update OpenAPI/Swagger or JSDoc
6. **Record decisions**: Add Architecture Decision Records for significant choices

## Documentation Rules
- Document the *why*, not the *what* (code is the what)
- Keep examples up to date and runnable
- One ADR per significant architecture decision
- No outdated information -- remove or update stale docs

## Verification
- README accurately reflects current state
- No outdated sections remain
- New features have usage examples
- API changes are documented
