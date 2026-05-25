---
name: repair
description: Applies minimal targeted fixes to verified defects. No new features, no refactoring — defect resolution only.
---

# repair

## Overview
Apply the minimal fix that addresses the root cause identified by RCA. Verify the fix resolves the defect. Do not implement new features or refactor unrelated code.

## When to Use
- After RCA has determined the root cause
- The defect status is "analyzed" with a repair strategy

## Process
1. **Read defect**: Get root cause and repair strategy from registry
2. **Read source files**: Understand the code at the defect location
3. **Apply minimal fix**: Only the lines needed to fix the root cause
4. **Verify**: Run the failing test — it should now pass
5. **Update registry**: Set status to "fixed"

## Good vs Bad Repairs
| Good (targeted) | Bad (scope creep) |
|-----------------|-------------------|
| Add null check on line 45 | Rewrite the entire function |
| Fix off-by-one in pagination | Replace pagination library |
| Add input validation for email field | Redesign the entire form component |
| Add missing try/catch for async call | Restructure error handling framework |

## Anti-Rationalization
| Excuse | Counter |
|--------|---------|
| "While I'm here, I'll refactor this too" | Refactoring introduces risk — resist |
| "This pattern is better, let me change it everywhere" | Stick to the minimal fix |
| "I can make it more efficient" | Not during repair — file an enhancement |

## Verification
- Defect is fixed (reproduction test passes)
- Only the root cause was addressed
- No unrelated code was changed
- Defect registry updated to "fixed"
