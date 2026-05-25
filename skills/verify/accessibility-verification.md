---
name: accessibility-verification
description: Validates ARIA attributes, labels, keyboard navigation, focus management, tab order, color contrast, and semantic HTML on every page.
---

# accessibility-verification

## Overview
Verify every page meets accessibility standards. Check ARIA attributes, labels, keyboard navigation, focus management, tab order, color contrast, and semantic HTML. Every page must pass accessibility verification.

## When to Use
- After route verification
- Before acceptance gate
- After any UI repair

## Process
1. **Fetch each page**: Get the rendered HTML
2. **Check semantic structure**: Landmarks, headings, regions
3. **Check labels**: Every input, button, and link has an accessible name
4. **Check ARIA**: Roles have required attributes, no redundant roles
5. **Check keyboard**: Interactive elements reachable by Tab
6. **Check focus**: Focus management after actions (modal, navigation)
7. **Check color contrast**: Text-to-background contrast ratios
8. **Check images**: All images have alt text (decorative images have alt="")

## Accessibility Checklist
- [ ] Page has `<main>` landmark
- [ ] Page has `<nav>` for navigation
- [ ] Heading hierarchy (h1 → h2 → h3, no skips)
- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] All buttons have accessible names
- [ ] Tab order follows visual layout
- [ ] Focus indicator visible on all elements
- [ ] Color contrast >= 4.5:1 for normal text
- [ ] No keyboard traps
- [ ] ARIA attributes are valid and correct

## Anti-Rationalization
| Excuse | Counter |
|--------|---------|
| "Users don't use screen readers" | 1 in 6 people have a disability |
| "We'll fix a11y later" | Remediation costs 10x more after launch |
| "ARIA is too complex" | Basic semantic HTML covers 80% of a11y |

## Verification
- All pages pass accessibility checks
- No ARIA violations
- Keyboard navigation works throughout
- Color contrast meets WCAG AA minimum
