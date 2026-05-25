---
name: user-journey-generation
description: Automatically generates and executes user journeys from requirements, app structure, discovered UI, and available routes.
---

# user-journey-generation

## Overview
Derive user journeys from requirements, application structure, discovered UI elements, and available routes. Execute all journeys automatically. Common journeys: Register → Login → Create → Edit → Search → Delete → Logout.

## When to Use
- After route, form, and API verification passes
- Before acceptance gate
- When testing complete user workflows

## Process
1. **Read requirements**: Extract CRUD operations, workflows, user roles
2. **Read exploration report**: Discover all routes, forms, buttons, links
3. **Generate journeys**: Compose step sequences from available elements
4. **Execute journeys**: Run each step in sequence via HTTP or browser
5. **Verify outcomes**: Each step produces expected result
6. **Log defects**: Any step failure logged to registry

## Journey Types
| Type | Example |
|------|---------|
| Auth | Register → Login → Profile → Logout |
| CRUD | Create → Read → Update → Delete |
| Browse | Search → List → Detail → Back |
| Workflow | Submit → Review → Approve → Reject |
| Purchase | Browse → Add → Cart → Checkout → Confirm |

## Anti-Rationalization
| Excuse | Counter |
|--------|---------|
| "Unit tests cover this" | Journeys test cross-component behavior |
| "The journey is obvious" | Execute it to be sure |
| "I only test the happy path" | Error paths are journeys too |

## Verification
- All generated journeys executed
- Every step in every journey verified
- Defects from journey failures logged to registry
