---
name: skill-discovery
description: Maps incoming tasks to the right DevLoom skill workflow. Auto-loads at session start.
---

# skill-discovery

## Overview
This meta-skill runs at the start of every DevLoom agent session. It examines the task prompt and automatically loads the most relevant domain-specific skill.

## Classification Rules

### Frontend (FE)
| Trigger keywords | Skill to load |
|---|---|
| UI, component, React, Vue, Angular, CSS, HTML, frontend, interface, view, template, style, layout, responsive, design system, button, modal, form, input, dropdown, nav, sidebar | `frontend-development` |
| Design, Figma, mockup, prototype, wireframe, component tree, design token | `frontend-development` |

### Backend (BE)
| Trigger keywords | Skill to load |
|---|---|
| API, endpoint, route, REST, GraphQL, backend, server, service, controller, middleware | `backend-development` + `api-design` |
| database, SQL, NoSQL, query, migration, schema, model, entity, table, collection | `backend-development` |
| auth, login, JWT, OAuth, session, token, password, permission, role | `backend-development` + `security-review` |
| clean code, SOLID, design pattern, refactor, layer, architecture | `backend-development` |

### API / Interface Design
| Trigger keywords | Skill to load |
|---|---|
| api design, contract, interface, schema, openapi, swagger, endpoint signature, request/response | `api-design` |

### Testing (QA)
| Trigger keywords | Skill to load |
|---|---|
| test, spec, *.test.*, *.spec.*, pytest, jest, vitest, mocha, chai, unit, integration, e2e | `test-driven-development` + `quality-assurance` |

### Code Review
| Trigger keywords | Skill to load |
|---|---|
| code review, review, audit, pull request, PR, merge request, check, verify changes | `code-review` |

### Security
| Trigger keywords | Skill to load |
|---|---|
| security, auth, OWASP, XSS, SQLi, CSRF, CORS, sanitize, encrypt, hash, secret, PII, GDPR, compliance | `security-review` |

### Performance
| Trigger keywords | Skill to load |
|---|---|
| performance, optimize, slow, cache, bundle, lazy, load time, fps, Core Web Vitals, Lighthouse, N+1 | `performance-review` |

### Debugging
| Trigger keywords | Skill to load |
|---|---|
| bug, error, exception, crash, debug, fix, broken, fail, issue, problem, stack trace, log | `debugging` |

### Documentation
| Trigger keywords | Skill to load |
|---|---|
| docs, documentation, README, API docs, JSDoc, TSDoc, docstring, comment, ADR, changelog, migration guide | `documentation` |

## Process
1. Read the task prompt or user request
2. Scan for keywords matching any category above
3. Load ALL matching skills via the skill tool
4. If no explicit match, load the default skill for your agent role
5. Execute each loaded skill's workflow in order of relevance
6. Report which skills were activated in your completion message

## Agent Default Skills

| Agent | Default skill (when no keyword matches) |
|---|---|
| analyst | requirements-analysis |
| architect | architecture-planning |
| developer | incremental-development |
| qa | quality-assurance |
| documenter | documentation |
| orchestrator | skill-discovery |

## Verification
- At least one skill must be loaded per session
- If multiple skills match, load ALL that apply (e.g. FE + API design)
- Report activated skills in the session output
