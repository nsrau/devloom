---
name: planning
description: Turn a prompt into requirements then a dependency-ordered plan with tickets and test strategy.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/workflow.dsl

PHASE_REQ:
- prompt -> US|FR|NFR|AC|CTX|OQ
- capture EN|SingleActive|PersistAll|TDDReq|RegrReq
- tracker mode: local default, github only if explicit
- OUT: .opencode/devloom/requirements.md
- CHK: AC verifiable|No hidden assumptions|No impl details

PHASE_PLAN:
- read REQ + repo patterns
- LatestStableCheck + OfficialDocsFirst for stack-specific plan
- design with CleanArch: layered (domain<-app<-infra<-ui), DependencyInversion, ports/adapters, no domain->framework coupling
- emit Arch summary (boundaries, layers, data flow, ADR for non-obvious choices)
- split into small dep-ordered tasks (files|ac|tests|regr each), SOLID-aligned modules
- map tasks to project tickets as JSONM
- OUT: .opencode/devloom/plan.md
- CHK: tasks verifiable|small|ordered|respect layer boundaries

SCOPE: run REQ only, PLAN only, or both per orchestrator request.
