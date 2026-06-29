UX_BAR: Accessible(WCAG-AA)|Consistent|Responsive|ClearFeedback|ErrorRecovery|NoLayoutShift
EXPLORE:
- visit all reachable routes
- enumerate buttons|links|forms|modals|tables|tabs
- continue until no new surface
- OUT: exploration-report.json
DOM:
- size>0
- visible
- inViewport
- notBlocked
- computedStyleSane
ROUTE:
- render
- noBlank
- noCrash
- noConsoleErr
- noNavFail
- noHydrationErr
- domVisible
- noBlockedClick
FORM:
- valid
- invalid
- required
- boundary
- loading
- successMsg
- errorMsg
A11Y:
- role
- label
- focus
- kbNav
- escClose
- contrast
- semanticHtml
API:
- auth
- authz
- inputVal
- outputSchema
- statusCodes
- errorShape
- paging/filter/sort if applicable
CONTRACT:
- generate/open OpenAPI when needed
- compare runtime fields/types/status to contract
STATE:
- enumerate valid states
- verify transitions + recovery paths
JOURNEY:
- derive from REQ+routes+ui
- CRUD
- LoginFlow
- SearchFilterSort
- ErrorRecovery
SEC:
- depAudit
- noSecrets
- cors
- sanitize
- auth
- authz
- inputVal
- outputSchema
- leastPrivilege
- noInternalFieldLeak
- massAssignment
- overposting
- xss
- csrf
- idor
PERF:
- loadTime
- noLeak
- noExcessRender
- bundleOk
