---
name: backend-development
description: Server-side logic, database, middleware, clean code, and SOLID principles.
---

# backend-development

## Overview
Build backend services following clean architecture, SOLID principles, and language-specific best practices.

## When to Use
- Building or modifying server-side code
- Working with databases, APIs, middleware, services

## Process
1. **Identify layer boundaries**: Controller -> Service -> Repository -> Data
2. **Define interfaces first**: Contracts between layers
3. **Handle errors systematically**: Return types, error codes, logging
4. **Validate inputs**: At boundary (controller/endpoint)
5. **Implement business logic**: Pure functions where possible
6. **Add persistence**: Repository pattern, queries, migrations

## Quality Gates
- Input validation at every entry point
- Error handling with meaningful messages
- No N+1 queries
- Proper HTTP status codes
- Idempotency for mutating endpoints

## Verification
- All endpoints return correct status codes
- Error cases return structured errors
- Tests cover success + failure paths
