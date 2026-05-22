---
name: architecture-planning
description: Designs solutions and creates ordered implementation plans with dependency resolution.
---

# architecture-planning

## Overview
Transform requirements into a concrete, ordered implementation plan with dependency-resolved tasks, architecture decisions, and testing strategy.

## When to Use
- Requirements document is ready
- You need to create `.opencode/devloom/plan.md`

## Process
1. **Read requirements**: Fully understand the scope
2. **Explore codebase**: Understand existing patterns, conventions, tech stack
3. **Design architecture**: 2-4 sentence overview with key decisions
4. **Break into tasks**: Each task must be:
   - Independently verifiable
   - < 200 lines of code
   - Dependency-ordered
5. **Define acceptance per task**: Clear, testable criteria
6. **Define testing strategy**: Unit, integration, E2E
7. **Note rollout steps**: Migrations, env vars, deployment

## Anti-Rationalization
| Excuse | Counter |
|---|---|
| "I'll figure out the architecture while coding" | Design first -- refactoring mid-build costs 10x |
| "One big task is fine" | Break it down -- small tasks are verifiable |
| "Tests can be added later" | Testing strategy is part of the plan |

## Verification
- Plan file exists at `.opencode/devloom/plan.md`
- Tasks are ordered by dependency
- Each task has clear acceptance criteria
