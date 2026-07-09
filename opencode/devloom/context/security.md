# Security Requirements
> Auto-generated: 2026-07-09T13:36:53.535Z
> MVI: keep under 200 lines. Edit manually to override.

## Detected Patterns
- Validate all user input (never trust input)
- Use parameterized queries (no string concatenation for SQL)
- Store secrets in environment variables, never hardcode
- Use .env files for local dev, add .env to .gitignore

## Universal Rules
- Never trust user input — validate everything
- Parameterized queries only (no SQL string concatenation)
- Secrets in environment variables, never in code
- .env files in .gitignore
- Auth checks on every protected route
- Rate limit auth endpoints
