---
name: contract-validation
description: Generates OpenAPI specifications automatically when missing. Compares runtime behavior against contract. Detects schema violations.
---

# contract-validation

## Overview
Ensure API contract compliance. If no OpenAPI/Swagger spec exists, generate one from runtime behavior. Compare runtime responses against the contract to detect missing fields, invalid types, unexpected responses, and endpoint mismatches.

## When to Use
- During API verification
- After API changes
- Before acceptance gate

## Process
1. **Check for existing spec**: Find openapi.yaml, openapi.json, swagger.*
2. **If missing, generate**: Create OpenAPI 3.0 spec from discovered endpoints
3. **Parse contract**: Extract paths, methods, request schemas, response schemas
4. **Compare runtime**: For each endpoint, compare actual responses to contract
5. **Detect violations**: Missing fields, wrong types, unexpected fields, wrong status codes
6. **Report**: Log contract violations to defect registry

## Contract Violations
| Type | Detection |
|------|-----------|
| Missing field | Response object lacks property defined in contract |
| Extra field | Response object has property not in contract |
| Type mismatch | Field value type differs from contract (string vs number) |
| Wrong status | Endpoint returns 200 but contract specifies 201 |
| Missing endpoint | Contract path returns 404 at runtime |
| Orphan endpoint | Runtime path not documented in contract |

## Anti-Rationalization
| Excuse | Counter |
|--------|---------|
| "The contract is generated anyway" | Generated contracts must still be validated |
| "Types are close enough" | String != number — be precise |
| "Extra fields don't hurt" | They break strict clients |

## Verification
- OpenAPI spec exists (generated or provided)
- All endpoints documented
- No contract violations between spec and runtime
