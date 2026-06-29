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

The highest quality profile. Assigns the best available reasoning models to planning and architecture roles, the largest context models to implementation roles, and precise verification models to quality roles. Recommended for production work, complex features, and any task where quality is the primary concern.

| Role | Model |
|---|---|
| orchestrator | opencode-go/glm-5.1 |
| planner | opencode-go/glm-5.1 |
| developer | opencode-go/kimi-k2.6 |
| qa | opencode-go/deepseek-v4-pro |
| verifier | opencode-go/deepseek-v4-pro |
| security | opencode-go/deepseek-v4-pro |
| documenter | opencode-go/glm-5.1 |

### go-economy

A lower cost profile that retains Kimi K2.6 for the developer role (where long context matters most) and uses DeepSeek V4 Pro for orchestrator, qa, verifier, and security roles. Qwen handles documentation at reduced cost. Suitable for routine development work where premium reasoning is not essential.

| Role | Model |
|---|---|
| orchestrator | opencode-go/deepseek-v4-pro |
| planner | opencode-go/kimi-k2.6 |
| developer | opencode-go/kimi-k2.6 |
| qa | opencode-go/deepseek-v4-pro |
| verifier | opencode-go/deepseek-v4-pro |
| security | opencode-go/deepseek-v4-pro |
| documenter | opencode-go/qwen3.6-plus |

### free

A zero-cost profile using only freely available models. Intended for experimentation, open-source projects, learning, and low-stakes development where cost must be zero. All agents use the same free-tier model. If a specific free model is unavailable, the fallback chain is: opencode/nemotron-3-ultra-free -> opencode/big-pickle -> opencode/mimo-v2.5-free -> opencode/deepseek-v4-flash-free.

| Role | Model |
|---|---|
| all agents | opencode/nemotron-3-ultra-free |

## Model Guidance

### When to Use GLM 5.1

GLM 5.1 (opencode-go/glm-5.1) provides the strongest reasoning and planning capabilities among available models. It is the best choice when a task requires:

- Architectural design and system decomposition
- Requirements analysis and specification writing
- UX-aware decisions that balance user experience with technical constraints
- Multi-step planning with dependency management
- High-stakes decisions where incorrect reasoning would be costly

In practice, GLM 5.1 should be assigned to the orchestrator, planner, and any agent that makes strategic decisions. For UI/UX-heavy Angular or React SaaS frontend work, GLM 5.1 delivers superior reasoning around component hierarchies, state management patterns, accessibility, and user flow design.

### When to Use Kimi K2.6

Kimi K2.6 (opencode-go/kimi-k2.6) offers the largest context window of any available model. This makes it ideal for tasks that need to process large volumes of code or data:

- Multi-file implementation changes that span many modules
- Refactoring across large codebases
- Code exploration and discovery (the developer/planner roles)
- Fixing bugs that require broad context to understand the full system
- Backend and data-intensive work where the context of multiple services, database schemas, and data pipelines must be held simultaneously

Kimi K2.6 is the primary workhorse for the developer and repair roles because implementation tasks typically require loading many files into context.

### When to Use DeepSeek V4 Pro

DeepSeek V4 Pro (opencode-go/deepseek-v4-pro) excels at structured, analytical tasks with clear right/wrong answers. It is the best choice for:

- Verification and validation of any kind (routes, forms, APIs, accessibility)
- Writing and running tests
- Debugging and root cause analysis (RCA)
- Regression testing
- Quality assurance reviews

DeepSeek V4 Pro is reliable and precise, making it the default for all verifier roles and QA. It performs well on tasks that benefit from methodical step-by-step analysis rather than creative exploration.

### When to Use DeepSeek V4 Flash

DeepSeek V4 Flash (opencode-go/deepseek-v4-flash) is a lower-cost, faster model. It powers every role in the default `go-flash` profile, and in the higher-tier profiles it suits well-scoped, deterministic work (simple verification scopes, routine fixes) that does not benefit from premium reasoning. Using Flash there reduces cost without meaningful quality loss.

### When to Use Qwen Models

Qwen models (opencode-go/qwen3.6-plus) provide good quality at lower cost. They are suitable for roles that benefit from competent language understanding but do not require the highest reasoning bar:

- Analysis of well-defined requirements
- Documentation writing
- Code summarization
- Tasks where the cost of premium models is not justified by the task complexity

In the go-economy profile, Qwen replaces GLM 5.1 for the documenter role, significantly reducing cost while maintaining acceptable output quality.

### When to Use MiniMax / Nemotron / Big Pickle (Free Tier)

The free tier models (opencode/nemotron-3-ultra-free, opencode/big-pickle, opencode/mimo-v2.5-free, opencode/deepseek-v4-flash-free) are suitable only when:

- Cost must be exactly zero
- The task is experimental or exploratory
- The project is in early ideation and quality is less critical
- The user is evaluating DevLoom and does not want to commit to paid models

These models have significantly lower reasoning capability and smaller context windows. They are not recommended for production work, complex features, or any task where correctness is critical.

## Frontend vs Backend Guidance

### UI/UX-Heavy Frontend Work (Angular, React, SaaS)

Frontend development involves numerous design decisions: component decomposition, state management, accessibility, responsive layout, user flow, and framework-specific patterns. These decisions benefit from strong reasoning rather than large context.

**Recommendation:** Use GLM 5.1 for planning, architecture, and review of frontend work. Use Kimi K2.6 for implementation when the task spans many files (common in Angular/React features).

### Backend and Data-Intensive Work

Backend development often requires understanding many interconnected services, database schemas, API contracts, and data pipelines simultaneously. Context size matters more than peak reasoning.

**Recommendation:** Use Kimi K2.6 for all backend implementation roles. Its large context window allows it to hold the full system in context without truncation.

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
opencode task --model opencode-go/glm-5.1 "implement feature"
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
    "developer": "opencode-go/glm-5.1",
    "qa": "opencode-go/kimi-k2.6"
  }
}
```

Overrides merge on top of the selected profile and take precedence for the specified roles.
