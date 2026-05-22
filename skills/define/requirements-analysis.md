---
name: requirements-analysis
description: Extracts structured requirements from user prompts into a requirements document.
---

# requirements-analysis

## Overview
Systematically extract user intent, constraints, and acceptance criteria from a natural-language prompt into a structured requirements document.

## When to Use
- The user provides a feature request, bug report, or idea
- You need to create `.opencode/devloom/requirements.md`

## Process
1. **Extract user story**: "As a [role], I want [goal] so that [benefit]."
2. **Identify functional requirements**: List specific behaviors (FR-01, FR-02...)
3. **Identify non-functional requirements**: Performance, security, scalability, usability
4. **Define acceptance criteria**: Each must be independently verifiable
5. **Note constraints**: Language, framework, libraries, environment
6. **List open questions**: Ambiguities that need clarification
7. **Write output**: Follow the template in `.opencode/devloom/requirements.md`

## Anti-Rationalization
| Excuse | Counter |
|---|---|
| "The prompt is clear enough" | Write it down anyway -- specs prevent scope creep |
| "I can infer the constraints" | State them explicitly or mark as open questions |
| "ACs are obvious" | If they're obvious, writing them takes 30 seconds |

## Verification
- Requirements document exists at `.opencode/devloom/requirements.md`
- Every AC is independently verifiable
- No ambiguities unmarked as open questions
