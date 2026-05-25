# Verification Policy Pack

Unified enforcement checklist system. Single source of truth for all verification rules.

## Scope

This document consolidates ALL verification rules previously scattered across individual agents. Agents reference this policy by rule ID — never re-state the rules.

## Rule Reference

### ROUTE-001: Page Rendering

Every route must:
- Render successfully (no crash, no blank page)
- No runtime exceptions
- No console errors
- No navigation failures
- No hydration issues (SSR apps)

### ROUTE-002: DOM Integrity

Inspect every page with:
```text
getBoundingClientRect()
computedStyle
display ≠ none
visibility ≠ hidden
opacity > 0
width > 0
height > 0
```

Detect:
- Zero-width/height elements
- Elements outside viewport
- Overlapping elements
- Blocked click targets
- Invisible labels
- Broken layouts

### ROUTE-003: Vision Validation (when available)

Capture screenshots. Detect:
- Clipped text
- Overflow
- Broken alignment
- Missing components
- Layout regressions
- Responsive breakpoint issues

Vision supplements DOM checks. Does not replace them.

### FORM-001: Submission Testing

Every form must be tested for:
- Valid submission (correct data → success)
- Invalid submission (bad data → error)
- Required field validation (empty required → error)
- Boundary conditions (max length, special chars, etc.)
- Success message display
- Error message display (correct field, correct message)
- Loading state during submission

### FORM-002: Form Elements

Check all form controls:
- Input fields (text, number, email, password, date, file)
- Select dropdowns
- Checkboxes and radio buttons
- Textareas
- Submit buttons
- Reset buttons

### A11Y-001: ARIA Compliance

Every interactive element must have:
- Proper role attribute
- aria-label or aria-labelledby where label is not visible
- aria-expanded for expandable controls
- aria-selected for tab/option selection
- aria-current for active navigation

### A11Y-002: Keyboard Navigation

Verify:
- All interactive elements reachable via Tab
- Tab order follows visual order (top-left to bottom-right)
- Focus indicators visible on all focusable elements
- No focus trap (unless modal — and must have escape hatch)
- Enter/Space activates buttons and links
- Escape closes modals/drawers/dropdowns
- Arrow keys navigate select, radio groups, tabs

### A11Y-003: Color & Contrast

- Text contrast ≥ 4.5:1 (normal text) or ≥ 3:1 (large text)
- Focus indicator contrast ≥ 3:1
- No color-only information conveyance

### A11Y-004: Semantic HTML

- Use `<nav>` for navigation
- Use `<main>` for primary content
- Use `<h1>`–`<h6>` for headings in correct order
- Use `<button>` for actions, `<a>` for navigation
- Use `<form>` with proper `<label>` associations

### API-001: Endpoint Verification

Every endpoint must be verified for:
- Authentication (401 when unauthenticated)
- Authorization (403 when unauthorized)
- Input validation (400 on malformed input)
- Output schema (all expected fields present, correct types)
- Status codes (200, 201, 204, 400, 401, 403, 404, 500)
- Error response format (consistent error shape)
- Pagination (where applicable: page, limit, total, next/prev cursors)
- Filtering (where applicable: filter params work correctly)
- Sorting (where applicable: sort params work correctly)

### API-002: Contract Validation

- Generate OpenAPI specification if missing
- Compare runtime response against contract
- Detect: missing fields, type mismatches, invalid response shapes, contract violations

### E2E-001: Targeted Execution

During development iterations:
- Run only E2E tests affected by changed files
- Map: changed file → impacted routes → impacted E2E tests

### E2E-002: Full Coverage

Before final acceptance:
- Run complete E2E suite
- No skipped tests
- All user journeys executed

### JOURNEY-001: Journey Generation

Generate journeys from:
- Requirements document
- Discovered routes
- UI elements from exploration report
- Application structure

Standard journey patterns:
```text
Create → Read → Update → Delete (CRUD)
Login → Protected Action → Logout
Search → Filter → Sort → View Detail
Error Path: Invalid Input → Error → Recovery → Success
```

### JOURNEY-002: State Transitions

Discover and test application states:
```text
Draft → Submitted → Approved → Rejected → Archived → Reopened
Active → Inactive
Pending → Confirmed → Cancelled
Open → In Progress → Resolved → Closed
```

Test every valid state transition automatically.

### PERF-001: Performance Checks

- Page load time (reasonable threshold per app type)
- No render-blocking resources
- No memory leaks on repeated navigation
- No excessive re-renders
- Bundle size within acceptable limits

### SEC-001: Security Checks

- Dependency audit (`npm audit`)
- No hardcoded secrets (password, secret, api_key, token in source)
- No exposed internal endpoints
- Proper CORS configuration
- Input sanitization on user-facing forms

## Agent-to-Rule Mapping

| Agent | Rules Enforced |
|-------|----------------|
| Route Verifier | ROUTE-001, ROUTE-002, ROUTE-003 |
| Form Verifier | FORM-001, FORM-002 |
| A11y Verifier | A11Y-001, A11Y-002, A11Y-003, A11Y-004 |
| API Verifier | API-001, API-002 |
| Journey Agent | JOURNEY-001, JOURNEY-002 |
| Explorer | ROUTE-002 (pre-discovery pass) |
| QA | Runs tests that cover all applicable rules |
| Regression | E2E-001 (targeted), E2E-002 (final) |
| Developer | Must not introduce violations of any rule |

## Enforcement

1. Each rule violation = defect in registry.
2. Severity: CRITICAL (broken functionality), HIGH (broken UX), MEDIUM (non-compliant but functional), LOW (cosmetic).
3. Defect must reference the rule ID that was violated.
4. No gate passes if any CRITICAL or HIGH defect is open.
5. All rules are mandatory. "Skip" is not an option — only "escalate" after 3 failed repair cycles.
