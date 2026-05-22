---
name: security-review
description: OWASP Top 10 prevention, input validation, auth patterns, secrets management.
---

# security-review

## Overview
Audit code against OWASP Top 10 vulnerabilities. Check input validation, authentication, authorization, data exposure, and secrets management.

## When to Use
- Code handles user input, authentication, or data storage
- Implementing external integrations
- Security-sensitive features (payments, PII, auth)

## Process
1. **Check input validation**: Every entry point validates and sanitizes
2. **Check authentication**: Tokens, sessions, passwords handled securely
3. **Check authorization**: Role checks, resource ownership, least privilege
4. **Check data exposure**: No secrets in code, no PII in logs, no sensitive data in URLs
5. **Check dependencies**: Known vulnerabilities, outdated packages
6. **Check headers**: CORS, CSP, HSTS, X-Frame-Options

## OWASP Top 10 Quick Check
- [ ] Broken Access Control
- [ ] Cryptographic Failures
- [ ] Injection (SQL, NoSQL, OS, LDAP)
- [ ] Insecure Design
- [ ] Security Misconfiguration
- [ ] Vulnerable Components
- [ ] Auth Failures
- [ ] Data Integrity Failures
- [ ] Logging Failures
- [ ] SSRF

## Verification
- All entry points have validation
- No hardcoded secrets or credentials
- Auth checks on protected resources
- Security headers set on responses
