# DevLoom Model Routing Profiles

## Overview

Model routing assigns a specific language model to each agent role. Different models offer different trade-offs between reasoning quality, context, cost, and speed. Profiles let users pick the right balance without changing agent logic.

Each of the 8 DevLoom agents (orchestrator, planner, developer, qa, verifier, security, documenter, vision) receives a model from the active profile. The orchestrator applies these when dispatching tasks.

## How Profile Selection Works

1. Profile is read from `.opencode/devloom/project/config.json` under `modelRouting`.
2. Default: `go-flash` (deepseek-v4-flash for every role except vision).
3. Override per task via `--model` flag or `OPENCODE_MODEL_OVERRIDE` env var.

```json
{ "modelRouting": "go" }
```

## Profiles

### go (max quality)

The highest quality profile for production work. Orchestrator uses DeepSeek V4 Flash (cheapest — runs every turn; vision delegated to `devloom-vision`). Qwen 3.7 Max to planner (strong reasoning), Kimi K2.7 Code to implementation, GLM 5.2 to security (forensic depth), DeepSeek V4 Pro to QA/verifier, Qwen 3.7 Plus to documentation, Qwen 3.6 Plus to vision (low-cost multimodal).

| Role | Model |
|---|---|
| orchestrator | opencode-go/deepseek-v4-flash |
| planner | opencode-go/qwen3.7-max |
| developer | opencode-go/kimi-k2.7-code |
| qa | opencode-go/deepseek-v4-pro |
| verifier | opencode-go/deepseek-v4-pro |
| security | opencode-go/glm-5.2 |
| documenter | opencode-go/qwen3.7-plus |
| vision | opencode-go/qwen3.6-plus |

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
| vision | opencode-go/qwen3.6-plus |

### go-flash

All agents on DeepSeek V4 Flash for maximum throughput at minimum cost. Vision uses Qwen 3.6 Plus (multimodal).

| Role | Model |
|---|---|
| orchestrator | opencode-go/deepseek-v4-flash |
| planner | opencode-go/deepseek-v4-flash |
| developer | opencode-go/deepseek-v4-flash |
| qa | opencode-go/deepseek-v4-flash |
| verifier | opencode-go/deepseek-v4-flash |
| security | opencode-go/deepseek-v4-flash |
| documenter | opencode-go/deepseek-v4-flash |
| vision | opencode-go/qwen3.6-plus |

### deepseek

All DeepSeek V4 Pro agents (consistent provider affinity). Vision uses Qwen 3.6 Plus (multimodal).

| Role | Model |
|---|---|
| orchestrator | opencode-go/deepseek-v4-pro |
| planner | opencode-go/deepseek-v4-pro |
| developer | opencode-go/deepseek-v4-pro |
| qa | opencode-go/deepseek-v4-pro |
| verifier | opencode-go/deepseek-v4-pro |
| security | opencode-go/deepseek-v4-pro |
| documenter | opencode-go/deepseek-v4-pro |
| vision | opencode-go/qwen3.6-plus |

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

### When to Use MiniMax M3 (Multimodal)

MiniMax M3 (opencode-go/minimax-m3) is multimodal but is not the default in any current profile. The `devloom-vision` agent uses Qwen 3.6 Plus (multimodal, lower cost). MiniMax M3 may still be used as a vision fallback if Qwen 3.6 Plus is unavailable. Use it directly only when you need a multimodal model with no vision delegation overhead.

### When to Use DeepSeek V4 Pro

DeepSeek V4 Pro (opencode-go/deepseek-v4-pro) excels at structured, analytical tasks. It is the default qa and verifier in the go profile, and the default for most roles in `deepseek` and `go-economy`, because these roles benefit from precision over open-ended reasoning.

Best uses: planning, verification, writing/running tests, debugging, root-cause analysis, regression reviews.

### When to Use DeepSeek V4 Flash

DeepSeek V4 Flash (opencode-go/deepseek-v4-flash) is the cheapest Go model. It is the default orchestrator in the go and go-economy profiles because the orchestrator runs every turn and accumulates the highest token volume. Vision is delegated to `devloom-vision` (Qwen 3.6 Plus), so the orchestrator does not need multimodal capability. It is also the default for every role in the `go-flash` profile.

### When to Use Qwen Models

Qwen 3.7 Plus (opencode-go/qwen3.7-plus) is the latest Qwen model — documentation, analysis, code summarization. Qwen 3.7 Max (opencode-go/qwen3.7-max) is the planner in the `go` profile for strong reasoning. Qwen 3.6 Plus (opencode-go/qwen3.6-plus) is the default multimodal model for the `devloom-vision` agent — lowest-cost multimodal option on the OpenCode Go plan.

### When to Use Free Tier Models

Free models (opencode/nemotron-3-ultra-free, opencode/big-pickle, opencode/mimo-v2.5-free, opencode/deepseek-v4-flash-free, opencode/north-mini-code-free, opencode/hy3-free) are suitable only when cost must be zero — experimentation, learning, or evaluation. They have lower reasoning capability and smaller context windows, not recommended for production work.

## Frontend vs Backend Guidance

### UI/UX-Heavy Frontend Work (Angular, React, SaaS)

Frontend development involves numerous design decisions: component decomposition, state management, accessibility, responsive layout, user flow, and framework-specific patterns. These decisions benefit from strong reasoning rather than large context.

**Recommendation:** Use DeepSeek V4 Pro (planner) for planning, architecture, and review of frontend work. Use Kimi K2.7 Code for implementation when the task spans many files (common in Angular/React features).

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
