---
name: performance-review
description: Measure-first approach. Bundle analysis, Core Web Vitals, N+1 detection, profiling.
---

# performance-review

## Overview
Review code for performance issues using a measure-first approach. Detect N+1 queries, unnecessary re-renders, large bundles, and slow operations.

## When to Use
- Performance requirements exist
- Suspecting performance regressions
- Code touches hot paths, data-heavy operations, or renders

## Process
1. **Check query patterns**: N+1, unnecessary fetches, missing indexes
2. **Check bundle**: Large imports, code-splitting opportunities
3. **Check rendering**: Unnecessary re-renders, missing memoization
4. **Check assets**: Image sizes, font loading, lazy loading
5. **Check caching**: API caching, data caching, memoization
6. **Measure**: Profile before and after if possible

## Common Anti-Patterns
| Pattern | Problem | Fix |
|---|---|---|
| N+1 queries | Database call per item | JOIN or batch |
| Unmemoized computations | Recalculated on every render | useMemo, useCallback |
| Large bundles | Slow initial load | Code splitting |
| Missing lazy loading | All assets load at once | Intersection Observer |
| No cache headers | Repeated identical requests | Cache-Control, ETag |

## Verification
- No N+1 query patterns
- Bundle impact assessed
- Cache strategy appropriate for use case
