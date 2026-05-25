---
name: form-verification
description: Tests every form — valid and invalid submission, field validation, boundary values, error/success states.
---

# form-verification

## Overview
Systematically test every form in the application: valid submission, invalid submission, required field validation, boundary values, error messages, success messages, and loading states.

## When to Use
- After route verification completes
- When forms are discovered by the explorer

## Process
1. **Read exploration report**: Get all discovered forms and their fields
2. **Test valid submission**: Fill all fields with valid data
3. **Test invalid submission**: Submit empty or invalid data
4. **Test field validation**: Leave each required field empty individually
5. **Test boundaries**: Min/max length, min/max values, special characters
6. **Test feedback**: Verify error messages, success messages, loading states
7. **Test XSS**: Submit `<script>` tags in text fields

## Form Test Matrix
| Test Case | Expected Result |
|-----------|-----------------|
| Valid data | 2xx, success message |
| Empty form | 4xx, validation errors |
| Missing required field | Error for that specific field |
| Exceed max length | Truncation or validation error |
| Invalid email format | Format validation error |
| XSS in text field | Input sanitized, no script execution |

## Anti-Rationalization
| Excuse | Counter |
|--------|---------|
| "Frontend validation is enough" | Backend must validate independently |
| "Testing all fields takes too long" | Automated tests cover all fields quickly |
| "Boundary values are rare" | That's exactly when bugs appear |

## Verification
- Every form tested with valid and invalid data
- Validation errors match the specific field
- No XSS reflected in responses
- Success/error states visible to user
