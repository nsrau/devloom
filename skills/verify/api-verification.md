---
name: api-verification
description: Verifies every API endpoint — auth, validation, output schema, status codes, error handling, pagination, filtering, sorting.
---

# api-verification

## Overview
Verify every API endpoint in the application. Validate authentication, authorization, input validation, output schema, status codes, error handling, pagination, filtering, and sorting.

## When to Use
- After route and form verification
- Before user journey testing
- When contract validation is needed

## Process
1. **Discover endpoints**: Scan source code and probe at runtime
2. **Run auth tests**: Protected endpoints reject unauthenticated requests
3. **Run validation tests**: Invalid input returns 4xx with error details
4. **Check output schema**: Response structure matches expectations
5. **Check status codes**: Correct codes for success and failure
6. **Check pagination/filtering/sorting**: List endpoints support query params
7. **Check error handling**: Structured errors, no stack traces
8. **Generate OpenAPI spec**: If none exists, create one from runtime behavior

## API Verification Checklist
- [ ] Auth enforced on protected endpoints (401 without token)
- [ ] Authorization enforced (403 for wrong role)
- [ ] Input validation on all mutation endpoints
- [ ] Output schema matches contract
- [ ] Correct status codes
- [ ] Structured error responses
- [ ] Pagination on list endpoints
- [ ] CORS headers present
- [ ] Rate limiting active (if applicable)

## Anti-Rationalization
| Excuse | Counter |
|--------|---------|
| "Auth is checked on the frontend" | Backend auth is mandatory |
| "This endpoint is internal" | Still needs validation |
| "The contract is outdated" | Generate a new one from behavior |

## Verification
- All endpoints verified for auth, validation, and output
- Contract violations detected and logged
- OpenAPI spec generated if missing
