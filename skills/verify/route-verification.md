---
name: route-verification
description: Verifies every route in the application — page renders, no runtime errors, DOM integrity, console errors.
---

# route-verification

## Overview
Verify every discovered application route. Check page rendering, runtime errors, blank screens, navigation failures, hydration issues, console errors, and JavaScript exceptions.

## When to Use
- After application exploration is complete
- Before form or API verification

## Process
1. **Read exploration report**: Get all discovered routes
2. **Navigate to each route**: Use curl or headless browser
3. **Check HTTP status**: Expect 2xx for all routes
4. **Check content**: Page body has meaningful content (>50 chars)
5. **Check console**: No console errors or JS exceptions
6. **DOM inspection**: Check each element's bounding rect, computed style, visibility

## DOM Inspection Checklist
- [ ] No zero-width elements
- [ ] No zero-height elements
- [ ] No hidden interactive controls
- [ ] No elements outside viewport
- [ ] No overlapping elements covering controls
- [ ] All click targets >= 24px
- [ ] All labels visible and associated
- [ ] Layout structure is well-formed

## Anti-Rationalization
| Excuse | Counter |
|--------|---------|
| "It compiles, so routes work" | Compilation != correct routing |
| "The 404 is expected" | Every route must resolve |
| "Small pages are fine" | Minimum content threshold ensures no blank pages |

## Verification
- All routes return 2xx
- No console errors on any route
- All interactive elements are visible and reachable
- Defects logged to registry
