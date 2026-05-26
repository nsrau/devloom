---
name: requirements-analysis
description: Build REQ from prompt with explicit constraints and AC.
---

LOAD: ~/.config/opencode/devloom-ai/core.dsl|~/.config/opencode/devloom-ai/workflow.dsl
DO:
- prompt -> US|FR|NFR|AC|CTX|OQ
- capture EN|SingleActive|PersistAll|TDDReq|RegrReq
- note tracker mode: local default, github only if explicit
OUT: .opencode/devloom/requirements.md
CHK: AC verifiable|No hidden assumptions|No impl details
