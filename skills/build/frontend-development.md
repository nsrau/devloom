---
name: frontend-development
description: Component architecture, design systems, state management, responsive design, accessibility.
---

# frontend-development

## Overview
Build user interfaces following component architecture principles, design system tokens, and accessibility standards.

## When to Use
- Building or modifying UI components
- Working with React, Vue, Angular, or any frontend framework

## Process
1. **Identify component tree**: Parent-child relationships, data flow
2. **Design component API**: Props, events, slots
3. **Handle states**: Loading, empty, error, success, edge cases
4. **Implement**: Start with markup, add styles, wire logic
5. **Verify rendering**: Check all states, responsive breakpoints
6. **Accessibility check**: Keyboard nav, screen reader, color contrast

## Quality Gates
- No inline styles (use design tokens / CSS modules)
- Loading, empty, error states handled
- Keyboard navigable
- Tests cover renders + interactions

## Verification
- Component renders in all states
- No accessibility violations
- Tests pass
