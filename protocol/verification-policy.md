# Verification Policy

LOAD: ~/.config/opencode/devloom-ai/verify.dsl

RULES:
- ROUTE-001=render|noBlank|noCrash|noConsoleErr|noNavFail|noHydrationErr
- ROUTE-002=domVisible|size>0|notHidden|notBlocked|inViewport
- ROUTE-003=screenshot/vision when available
- FORM-001=valid|invalid|required|boundary|successMsg|errorMsg|loading
- FORM-002=input|select|checkbox|radio|textarea|submit|reset
- A11Y-001=role|label|expanded|selected|current
- A11Y-002=tabReachable|focusVisible|orderOk|noTrap|enterSpace|escClose|arrowKeys
- A11Y-003=contrastText|contrastFocus|noColorOnly
- A11Y-004=nav|main|headingOrder|buttonVsLink|labelAssoc
- API-001=auth|authz|inputVal|outputSchema|statusCodes|errorShape|paging/filter/sort if app
- API-002=openapi if missing|runtime vs contract
- E2E-001=targeted impacted suite during iteration
- E2E-002=full suite before acceptance
- JOURNEY-001=generate from REQ+routes+ui
- JOURNEY-002=test valid state transitions
- PERF-001=loadTime|noLeak|noExcessRender|bundleOk
- SEC-001=depAudit|noSecrets|cors|sanitize

MAP:
- RouteVerifier=ROUTE-001|002|003
- FormVerifier=FORM-001|002
- A11yVerifier=A11Y-001|002|003|004
- ApiVerifier=API-001|002
- JourneyAgent=JOURNEY-001|002
- QA=run applicable rules
- Regression=E2E-001 during work; E2E-002 before done

ENFORCE:
- each violation => defect
- critical/high defect blocks gate
- skip is invalid; only escalate after 3 failed repair cycles
