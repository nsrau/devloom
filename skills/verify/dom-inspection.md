---
name: dom-inspection
description: Non-vision UI validation using getBoundingClientRect, computedStyle, and layout analysis to detect hidden, broken, or overlapping elements.
---

# dom-inspection

## Overview
Inspect the DOM programmatically to detect layout and rendering defects without screenshots. Uses `getBoundingClientRect()`, `window.getComputedStyle()`, and DOM traversal to find zero-width/height elements, hidden controls, overlaps, and broken layouts.

## When to Use
- During route verification
- After UI changes or repairs
- As part of the acceptance gate

## Process
1. **Fetch page HTML**: Get the rendered DOM
2. **Parse elements**: Find all interactive and structural elements
3. **Measure dimensions**: `getBoundingClientRect()` for width, height, position
4. **Check styles**: `getComputedStyle()` for visibility, opacity, display, position, z-index
5. **Detect defects**: Compare against known failure patterns

## Detection Patterns
| Pattern | Detection |
|---------|-----------|
| Hidden interactive | `display:none`, `visibility:hidden`, `opacity:0` on button/link/input |
| Zero-size element | `width === 0` or `height === 0` on any element |
| Off-screen | Element position outside viewport boundaries |
| Overlapping controls | Two interactive elements at same coordinates |
| Tiny target | Click target < 24x24 CSS pixels |
| Missing label | Input has no associated `<label>` or `aria-label` |
| Empty container | Container element with no children or text |

## Anti-Rationalization
| Excuse | Counter |
|--------|---------|
| "It looks fine to me" | DOM inspection catches invisible defects |
| "Zero-size elements are placeholders" | They still affect layout and accessibility |
| "Overlap is intentional" | Interactive controls must not overlap |

## Verification
- All interactive elements visible and reachable
- No zero-size interactive elements
- All click targets meet minimum size
- No layout structure defects
