---
name: application-exploration
description: Discovers all routes, pages, and interactive elements in a running application. Treats the running app as the source of truth.
---

# application-exploration

## Overview
Systematically discover every interactive element in the running application. Navigate routes, click buttons, open menus, submit forms, and continue until no new elements are found. The running application is the source of truth — not project specifications.

## When to Use
- After a task has been implemented
- Before running verification on routes, forms, or UI elements
- When you need to understand what the application actually does at runtime

## Process
1. **Start application**: `npm start` or equivalent
2. **Discover routes**: Probe common paths, extract from source, crawl links
3. **Visit each route**: Navigate, wait for render, scan DOM
4. **Catalog elements**: Record every interactive element type, selector, and attributes
5. **Interact**: Click, submit, open, toggle — every element gets its primary action
6. **Re-scan**: After each interaction, scan for newly revealed elements
7. **Repeat**: Continue until no new elements are found on any route
8. **Report**: Generate `.opencode/devloom/exploration-report.json`

## Exploration Checklist
- [ ] All routes discovered and visited
- [ ] Every button clicked
- [ ] Every form submitted (valid data)
- [ ] Every link navigated
- [ ] Every menu opened
- [ ] Every modal/drawer opened and closed
- [ ] Every tab clicked
- [ ] Every accordion expanded
- [ ] Every dropdown option selected
- [ ] Every search field used
- [ ] Every filter applied
- [ ] Every checkbox/radio toggled
- [ ] No element left untested

## Element Discovery Targets
| Category | Selectors |
|----------|-----------|
| Buttons | `button`, `[role="button"]`, `input[type="submit"]` |
| Forms | `form`, `[role="form"]` |
| Links | `a[href]`, `[role="link"]` |
| Modals | `[role="dialog"]`, `[role="alertdialog"]`, `.modal` |
| Menus | `nav`, `[role="navigation"]`, `[role="menu"]` |
| Inputs | `input`, `select`, `textarea` |
| Tabs | `[role="tab"]`, `[role="tablist"]` |

## Anti-Rationalization
| Excuse | Counter |
|--------|---------|
| "The spec says what the app does" | The running app is the truth — specs can be wrong |
| "I already tested the happy path" | Every interactive element must be tested |
| "Some elements are internal" | If users can see it, test it |

## Verification
- Exploration report exists at `.opencode/devloom/exploration-report.json`
- All routes visited
- All elements cataloged and interacted with
- Defects found during exploration logged to registry
