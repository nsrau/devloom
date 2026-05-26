FLOW: Analysis>Docs>Impl>Verify>Regr>Done
QUEUE:
- load CFG|BOARD|PSTATE on every prompt
- if pending work exists: continue it first
- if user reprioritizes: persist old active, then switch
- doing<=1 unless explicit override
PHASES:
- Analysis=req+constraints+openqs
- Docs=source check+plan+ticket map+ADR/doc deltas
- Impl=one ticket only|min change|tests
- Verify=lint+unit+integration+e2e as applicable
- Regr=targeted impacted checks + full gate before done
- Done=all AC pass|gates pass|no open high defect
GATES:
- build
- lint
- unit
- integration
- e2e
- routes
- buttons
- forms
- links
- journeys
- api
- a11y
- responsive
- visual
- perf
- security
- noOpenDefects
FAIL_PATH: defect>RCA>repair>reverify|max3cycles>escalate
