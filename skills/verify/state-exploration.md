---
name: state-exploration
description: Generates and explores application state transitions. Detects defects introduced by state changes — invalid transitions, data loss, orphaned records.
---

# state-exploration

## Overview
Explore application states and their transitions. Automatically derives state machines from requirements, data model, and UI patterns. Tests every valid and invalid transition. Detects data loss, orphaned records, and state display defects.

## When to Use
- After basic CRUD operations are verified
- When the application has stateful entities (status, workflow, lifecycle)
- Before acceptance gate

## Process
1. **Derive state machines**: From requirements, data model enums, UI patterns
2. **Create entity in initial state**: Set up test data
3. **Verify initial state**: Confirm state is correct after creation
4. **Test each transition**: Move through each allowed transition
5. **Test invalid transitions**: Try transitions not in the state machine
6. **Verify data integrity**: No field loss or corruption during transitions
7. **Test edge cases**: Transitions from every possible state, concurrent transitions

## Common State Machines
| Domain | State Sequence |
|--------|----------------|
| Tasks | Open → In Progress → Review → Done → Archived |
| Orders | Pending → Confirmed → Shipped → Delivered → Cancelled |
| Content | Draft → Submitted → Approved → Rejected → Published |
| Users | Active → Suspended → Banned → Deleted |

## Defect Patterns
| Defect | Detection |
|--------|-----------|
| Invalid transition | API accepts transition not in state machine |
| Data loss | Fields reset or nulled after transition |
| Wrong state display | UI shows different state than API |
| Orphaned records | Entity unreachable after transition to end state |
| State without timestamp | No audit trail for transition |

## Anti-Rationalization
| Excuse | Counter |
|--------|---------|
| "States are simple" | State bugs are among the hardest to find |
| "Users won't do that transition" | State machines must enforce all rules |
| "We audit in the UI" | Server-side audit trail is essential |

## Verification
- All state transitions tested (valid and invalid)
- No data loss during any transition
- State display consistent across API and UI
- Audit trail exists for all transitions
