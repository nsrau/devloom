# Coding Conventions
> Auto-generated: 2026-07-09T13:36:53.535Z
> MVI: keep under 200 lines. Edit manually to override.

## Naming
- Files: camelCase
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase

## Code Standards
- TypeScript strict mode
- No 'any' types
- Explicit return types on public APIs
- Prefer early returns over deep nesting
- No magic numbers — extract constants
- Co-locate tests next to source files
- One component/module per file

## File Organization
- Follow existing project directory structure
- Index files (index.ts) for barrel exports
- Test files: *.test.ts next to source
