---
name: api-design
description: Contract-first API design with consistent naming, error semantics, and versioning.
---

# api-design

## Overview
Design APIs following contract-first principles: consistent naming, predictable error semantics, and backward-compatible versioning.

## When to Use
- Designing new API endpoints
- Modifying existing API contracts

## Process
1. **Define resource model**: Nouns, relationships, fields
2. **Standardize naming**: `/api/v1/resources/:id`
3. **HTTP verbs**: GET (read), POST (create), PUT (replace), PATCH (update), DELETE
4. **Error format**: `{error: string, code: string, details?: any}`
5. **Status codes**: 200, 201, 204, 400, 401, 403, 404, 409, 422, 500
6. **Pagination**: `?page=&limit=` with total count
7. **Versioning**: URL prefix (`/v1/`) or header

## Anti-Rationalization
| Excuse | Counter |
|---|---|
| "I'll fix the API design later" | Every consumer becomes a breaking-change constraint |
| "REST-ish is fine" | Consistency is the #1 predictor of API quality |

## Verification
- Endpoint follows resource naming convention
- Error responses have consistent structure
- Status codes match HTTP semantics
