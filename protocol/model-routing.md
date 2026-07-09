# DevLoom Model Routing Profiles

## Overview

Model routing is the mechanism by which DevLoom assigns a specific language model to each agent role within a delivery pipeline. Different models offer different trade-offs between reasoning quality, context window size, cost, and speed. Routing profiles define these assignments declaratively, allowing users to select the right balance for their budget and quality requirements without modifying agent logic.

Each of the 7 DevLoom agents (orchestrator, planner, developer, qa, verifier, security, documenter) receives a model assignment from the active profile. The orchestrator applies these assignments when dispatching tasks to sub-agents.

## How Profile Selection Works

1. The orchestrator reads the active profile from `.opencode/devloom/project/config.json` under the `modelRouting` key.
2. If no profile is specified, `go-flash` is used as the default (cheapest Go model, deepseek-v4-flash for every agent).
3. Each agent task dispatched by the orchestrator includes the assigned model ID from the profile.
4. The sub-agent executes using that model.
5. Profiles can be overridden per-task via the `--model` flag or by setting the `OPENCODE_MODEL_OVERRIDE` environment variable.

Example config.json entry:

```json
{
  "modelRouting": "go"
}
```

## Profiles

### go (max quality)

The highest quality profile. Assigns GLM 5.2 to planning and architecture (best reasoning), Kimi K2.7 Code to implementation (best code generation), DeepSeek V4 Pro to verification roles, and Qwen 3.7 Plus to documentation. Recommended for production work, complex features, and any task where quality is the primary concern.

| Role | Model |
|---|---|
| orchestrator | opencode-go/glm-5.2 |
| planner | opencode-go/glm-5.2 |
| developer | opencode-go/kimi-k2.7-code |
| qa | opencode-go/deepseek-v4-pro |
| verifier | opencode-go/deepseek-v4-pro |
| security | opencode-go/deepseek-v4-pro |
| documenter | opencode-go/qwen3.7-plus |

### go-economy

A lower cost profile that retains Kimi K2.7 Code for the developer role and uses DeepSeek V4 Pro for orchestrator, qa, verifier, and security roles. Qwen 3.6 Plus handles documentation at reduced cost. Suitable for routine development work where premium reasoning is not essential.

| Role | Model |
|---|---|
| orchestrator | opencode-go/deepseek-v4-pro |
| planner | opencode-go/kimi-k2.7-code |
| developer | opencode-go/kimi-k2.7-code |
| qa | opencode-go/deepseek-v4-pro |
| verifier | opencode-go/deepseek-v4-pro |
| security | opencode-go/deepseek-v4-pro |
| documenter | opencode-go/qwen3.6-plus |

### free

A zero-cost profile using only freely available models. Intended for experimentation, open-source projects, learning, and low-stakes development where cost must be zero. All agents use the best available free-tier model. If a specific free model is unavailable, the fallback chain is: opencode/nemotron-3-ultra-free -> opencode/big-pickle -> opencode/mimo-v2.5-free -> opencode/deepseek-v4-flash-free -> opencode/north-mini-code-free -> opencode/hy3-free.

| Role | Model |
|---|---|
| all agents | opencode/nemotron-3-ultra-free |

## Model Guidance

### When to Use GLM 5.2

GLM 5.2 (opencode-go/glm-5.2) provides the strongest reasoning and planning capabilities among available models. It is the best choice when a task requires:

- Architectural design and system decomposition
- Requirements analysis and specification writing
- UX-aware decisions that balance user experience with technical constraints
- Multi-step planning with dependency management
- High-stakes decisions where incorrect reasoning would be costly

In practice, GLM 5.2 should be assigned to the orchestrator, planner, and any agent that makes strategic decisions. For UI/UX-heavy Angular or React SaaS frontend work, GLM 5.2 delivers superior reasoning around component hierarchies, state management patterns, accessibility, and user flow design.

### When to Use Kimi K2.7 Code

Kimi K2.7 Code (opencode-go/kimi-k2.7-code) offers the best code generation quality combined with a large context window. It is the successor to Kimi K2.6 with improved code generation, fewer hallucinations, and better adherence to instructions across long contexts. It is ideal for:

- Multi-file implementation changes that span many modules
- Refactoring across large codebases
- Code exploration and discovery (the developer/planner roles)
- Fixing bugs that require broad context to understand the full system
- Backend and data-intensive work where the context of multiple services, database schemas, and data pipelines must be held simultaneously

Kimi K2.7 Code is the primary workhorse for the developer role in the go and go-economy profiles.

### When to Use DeepSeek V4 Pro

DeepSeek V4 Pro (opencode-go/deepseek-v4-pro) excels at structured, analytical tasks with clear right/wrong answers. It is the best choice for:

- Multi-file implementation changes that span many modules
- Refactoring across large codebases
- Code exploration and discovery (the developer/planner roles)
- Fixing bugs that require broad context to understand the full system
- Backend and data-intensive work where the context of multiple services, database schemas, and data pipelines must be held simultaneously

Kimi K2.7 Code is the primary workhorse for the developer role in the go and go-economy profiles. When K2.7 Code is unavailable, the profile manager falls back to the best available model automatically.

### When to Use DeepSeek V4 Pro

DeepSeek V4 Pro (opencode-go/deepseek-v4-pro) excels at structured, analytical tasks with clear right/wrong answers:

- Verification and validation (routes, forms, APIs, accessibility)
- Writing and running tests
- Debugging and root cause analysis
- Regression testing and quality assurance reviews

### When to Use DeepSeek V4 Flash

DeepSeek V4 Flash (opencode-go/deepseek-v4-flash) is a lower-cost, faster model used for well-scoped, deterministic work where premium reasoning is unnecessary.

### When to Use Qwen Models

Qwen 3.7 Plus (opencode-go/qwen3.7-plus) is the latest Qwen model. Qwen 3.6 Plus (opencode-go/qwen3.6-plus) provides good quality at lower cost. Both suit documentation, analysis, and code summarization.

### When to Use Free Tier Models

Free models (opencode/nemotron-3-ultra-free, opencode/big-pickle, opencode/mimo-v2.5-free, opencode/deepseek-v4-flash-free, opencode/north-mini-code-free, opencode/hy3-free) are suitable only when cost must be zero — experimentation, learning, or evaluation. They have lower reasoning capability and smaller context windows, not recommended for production work.

## Frontend vs Backend Guidance

### UI/UX-Heavy Frontend Work (Angular, React, SaaS)

Frontend development involves numerous design decisions: component decomposition, state management, accessibility, responsive layout, user flow, and framework-specific patterns. These decisions benefit from strong reasoning rather than large context.

**Recommendation:** Use GLM 5.2 for planning, architecture, and review of frontend work. Use Kimi K2.7 Code for implementation when the task spans many files (common in Angular/React features).

### Backend and Data-Intensive Work

Backend development often requires understanding many interconnected services, database schemas, API contracts, and data pipelines simultaneously. Context size matters more than peak reasoning.

**Recommendation:** Use Kimi K2.7 Code for all backend implementation roles. Its large context window allows it to hold the full system in context without truncation.

## Configuration and Overrides

### Setting the Profile

In `.opencode/devloom/project/config.json`:

```json
{
  "modelRouting": "go"
}
```

Valid values: `"go"`, `"go-economy"`, `"deepseek"`, `"go-flash"`, `"free"`.

### Per-Task Override

Pass the `--model` flag to the orchestrator command:

```
opencode task --model opencode-go/glm-5.2 "implement feature"
```

### Environment Variable Override

Set `OPENCODE_MODEL_OVERRIDE` to any model ID to force all agents to use that model:

```
export OPENCODE_MODEL_OVERRIDE=opencode-go/deepseek-v4-flash
```

This overrides both the profile and the `--model` flag.

### Per-Role Override in Config

Individual role assignments can be overridden by adding a `modelRoutingOverrides` object in config.json:

```json
{
  "modelRouting": "go-economy",
  "modelRoutingOverrides": {
    "developer": "opencode-go/glm-5.2",
    "qa": "opencode-go/kimi-k2.7-code"
  }
}
```

Overrides merge on top of the selected profile and take precedence for the specified roles.
