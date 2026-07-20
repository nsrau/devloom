---
name: security-review
description: Full security audit for CRUD endpoints, data exposure, auth flows, and code changes.
---

LOAD: ~/.config/opencode/devloom-ai/verify.dsl

## Scope triggers (run only what applies)

- CRUD endpoint added/changed → ENDPOINT_AUDIT
- Data exposed via DTO/prop/event/response/serializer → EXPOSURE_AUDIT
- Auth/session/token code touched → AUTH_AUDIT
- Always → BASE_CHECKS

## BASE_CHECKS (always)

1. depAudit: run dependency audit (npm audit / equivalent); flag critical+high CVEs
2. noSecrets: scan diff + changed files for secrets, API keys, tokens, private keys, passwords (patterns: `sk-`, `AKIA`, `-----BEGIN`, `password\s*=`, hardcoded bearer)
3. sanitize: all user input validated/sanitized at the boundary (body, query, params, headers)
4. errorLeak: error responses do not leak stack traces, internal paths, SQL, or config

## ENDPOINT_AUDIT (per CRUD endpoint)

For each endpoint (method + route), verify:
1. **auth**: authentication required unless explicitly public (list public routes and confirm intent)
2. **authz**: authorization checks ownership/role — not just authentication (IDOR: can user A read/update user B's resource by changing the id?)
3. **tenantIsolation**: multi-tenant queries filter by tenant from the session/token, NEVER from client input
4. **inputValidation**: schema-validated body/params (reject unknown fields, type coercion traps)
5. **rateLimit**: mutation endpoints have rate limiting or are behind a gateway that does
6. **massAssignment**: update endpoints whitelist fields (no `update(req.body)` pass-through)
7. **cors**: CORS policy is explicit, not `*` with credentials

## EXPOSURE_AUDIT (per exposed field)

1. Trace each DTO/response field: does it include internal-only data (password hashes, internal ids, tokens, PII of other users)?
2. Serializers pick explicit fields — no `return user` with full ORM entity
3. List endpoints paginate and cap page size (no unbounded `?limit=99999`)
4. Logs do not write sensitive payloads (tokens, passwords, full PII)

## AUTH_AUDIT (when auth code changed)

1. Tokens: signed, expiring, refresh rotation where applicable
2. Passwords: bcrypt/argon2 with sane cost — never md5/sha1/plain
3. Session invalidation on logout/password change
4. Privilege escalation: role changes require admin + are audited
5. Timing attacks: login compares with constant-time comparison

## Output format

For each finding:
```
[SEVERITY: critical|high|medium|low] <category> — <file:line>
ISSUE: what is wrong
EXPLOIT: how it could be abused (1 line)
FIX: concrete remediation
```

Verdict rules:
- Any critical/high → SECURITY_FAIL (block the pipeline)
- Only medium/low → SECURITY_PASS_WITH_NOTES
- Clean → SECURITY_REVIEW_COMPLETE

RULES: check code as-written, not as-intended | no theoretical findings without a concrete exploit path | cite file:line for every finding | never auto-fix — report only.
