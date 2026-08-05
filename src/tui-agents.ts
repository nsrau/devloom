// Pure view-model helpers for the DevLoom TUI sidebar plugin (src/tui.ts).
// Kept free of any @opentui/solid / solid-js runtime imports so the logic is
// unit-testable in isolation.

export const DEVOOM_AGENT_PREFIX = "devloom-"
export const ORCHESTRATOR_AGENT_NAME = "devloom-orchestrator"
export const DEVOOM_SIDEBAR_ORDER = 100
export const DEVOOM_SIDEBAR_MAX_ROWS = 12

/** Minimal structural subset of the SDK `Agent` type served by /agent. */
export interface SidebarAgentModel {
  modelID: string
  providerID: string
}

export interface SidebarAgent {
  name: string
  description?: string
  mode?: string
  color?: string
  model?: string | SidebarAgentModel
}

/**
 * Derive a human-readable model name for display. The config hook injects the
 * model as a string (`provider/model`), while the SDK `/agent` endpoint
 * normalizes it to `{ modelID, providerID }`. Both are handled.
 */
export function formatAgentModel(model: string | SidebarAgentModel | undefined): string {
  if (!model) return ""
  if (typeof model === "string") return model
  return model.providerID ? `${model.providerID}/${model.modelID}` : model.modelID
}

export interface SidebarAgentView {
  name: string
  color: string
  mode: string
  model: string
  profileLabel: string | null
}

export interface SidebarAgentsView {
  /** The orchestrator (rendered first, highlighted), or null when absent. */
  orchestrator: SidebarAgentView | null
  /** Every other DevLoom agent, sorted by name. */
  others: SidebarAgentView[]
  /** The currently active profile derived from the orchestrator label, or null. */
  profile: string | null
  total: number
}

/**
 * Extract the `(profile: X)` marker the config hook stamps into the
 * orchestrator description, so the sidebar can surface the active profile.
 * Stops at the first comma so the extended `(profile: go, tier: senior)` form
 * still yields just the profile part.
 */
export function extractProfileLabel(description: string | undefined): string | null {
  if (!description) return null
  const match = /\(profile: ([^),]+)[^)]*\)/.exec(description)
  return match ? match[1] : null
}

/**
 * Extract the optional `tier: X` marker from the extended orchestrator label
 * (e.g. `(profile: go, tier: senior)`), or null when absent.
 */
export function extractTierLabel(description: string | undefined): string | null {
  if (!description) return null
  const match = /tier: ([^)]+)/.exec(description)
  return match ? match[1] : null
}

/**
 * Whether an agent name (`devloom-<variant>`) should be shown in the sidebar.
 * Mirrors `agentVariantVisible` in agents.ts without pulling the fs-bound
 * agents module into this pure view-model module. Only base and non-tiered
 * variants are shown; flash and senior variants are always hidden regardless
 * of the active profile.
 */
function variantVisible(name: string): boolean {
  const variant = name.startsWith(DEVOOM_AGENT_PREFIX) ? name.slice(DEVOOM_AGENT_PREFIX.length) : name
  return !variant.endsWith("-flash") && !variant.endsWith("-senior")
}

/**
 * Turn the raw agent list from `api.client.app.agents()` into the view models
 * rendered in the right sidebar: base and non-tiered DevLoom agents only
 * (flash and senior variants are hidden but still registered), orchestrator
 * first, the rest sorted by name, each with the model it uses. When `profile`
 * is omitted it is derived from the orchestrator label stamped by the config
 * hook — the backward-compatible path used by src/tui.ts, which passes no
 * args. Never throws; empty input yields an empty view.
 */
export function buildSidebarAgentViews(
  agents: readonly SidebarAgent[],
  profile?: string | null
): SidebarAgentsView {
  let resolvedProfile = profile ?? null
  if (resolvedProfile === null) {
    const orchestrator = agents.find(
      (agent) => agent && typeof agent.name === "string" && agent.name === ORCHESTRATOR_AGENT_NAME
    )
    if (orchestrator) {
      resolvedProfile = extractProfileLabel(orchestrator.description) ?? null
    }
  }
  const views: SidebarAgentView[] = []
  for (const agent of agents) {
    if (!agent || typeof agent.name !== "string" || !agent.name.startsWith(DEVOOM_AGENT_PREFIX)) continue
    if (!variantVisible(agent.name)) continue
    views.push({
      name: agent.name,
      color: typeof agent.color === "string" ? agent.color : "#7fdbca",
      mode: agent.mode ?? "subagent",
      model: formatAgentModel(agent.model),
      profileLabel: extractProfileLabel(agent.description),
    })
  }
  views.sort((a, b) => a.name.localeCompare(b.name))
  const orchestrator = views.find((view) => view.name === ORCHESTRATOR_AGENT_NAME) ?? null
  const others = views.filter((view) => view !== orchestrator)
  return { orchestrator, others, total: views.length, profile: resolvedProfile }
}
