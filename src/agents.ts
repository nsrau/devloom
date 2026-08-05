import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export interface ActiveProfile {
  profile?: string
  resolvedProfile?: string
  models?: Record<string, string>
  tier?: string | null
}

export function readActiveProfile(rootDir: string): ActiveProfile | null {
  const p = join(rootDir, ".opencode", "devloom", "config.json")
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, "utf8")) as ActiveProfile
  } catch {
    return null
  }
}

// Human-readable label shown in the sidebar so the current DevLoom profile is
// visible at a glance (e.g. "DevLoom Orchestrator: ... (profile: go-flash)").
// With a senior tier override the label is extended to "(profile: go, tier: senior)".
export function profileLabel(profile: ActiveProfile | null): string {
  const name = profile?.resolvedProfile ?? profile?.profile
  if (!name) return ""
  const tier = profile?.tier === "senior" ? ", tier: senior" : ""
  return ` (profile: ${name}${tier})`
}

// Whether a given agent variant should be surfaced in the sidebar / @-menu.
// Only base and non-tiered variants (orchestrator, developer, planner, qa,
// security, verifier, documenter, vision) are shown — flash and senior variants
// are always hidden regardless of the active profile. Non-matching variants
// stay registered so orchestrator task() routing keeps working; they are only
// hidden from the UI. Pure function, no fs access.
export function agentVariantVisible(_profile: ActiveProfile | null, variant: string): boolean {
  return !variant.endsWith("-flash") && !variant.endsWith("-senior")
}

const AGENT_VARIANTS: Record<string, string[]> = {
  developer: ["developer", "developer-flash", "developer-senior"],
  planner: ["planner", "planner-flash", "planner-senior"],
  qa: ["qa", "qa-flash"],
  verifier: ["verifier"],
  security: ["security", "security-senior"],
  documenter: ["documenter", "documenter-flash"],
  orchestrator: ["orchestrator"],
  vision: ["vision"],
}

export interface DevloomAgentMeta {
  name: string
  role: string
  description: string
  mode: "subagent" | "primary" | "all"
  color: string
  model: string
}

const ROLE_COLORS: Record<string, string> = {
  orchestrator: "#7fdbca",
  planner: "#c792ea",
  developer: "#addb67",
  qa: "#ecc48d",
  verifier: "#82aaff",
  security: "#ff5874",
  documenter: "#f07178",
  vision: "#f78c6c",
}

const DESCRIPTIONS: Record<string, string> = {
  "devloom-orchestrator": "DevLoom Orchestrator: autonomous multi-agent delivery",
  "devloom-planner": "DevLoom Planner: callable by the orchestrator for requirements and architecture planning",
  "devloom-planner-senior": "DevLoom Planner Senior: callable by the orchestrator for complex requirements and architecture planning",
  "devloom-planner-flash": "DevLoom Planner Flash: callable by the orchestrator for lightweight requirements and planning",
  "devloom-developer": "DevLoom Developer: callable by the orchestrator for ticket implementation and defect fixes",
  "devloom-developer-senior": "DevLoom Developer Senior: callable by the orchestrator for complex ticket implementation and defect fixes",
  "devloom-developer-flash": "DevLoom Developer Flash: callable by the orchestrator for simple ticket implementation and defect fixes",
  "devloom-qa": "DevLoom QA: callable by the orchestrator for verification, code review, and regression",
  "devloom-qa-flash": "DevLoom QA Flash: callable by the orchestrator for lightweight verification, code review, and regression",
  "devloom-verifier": "DevLoom Verifier: callable by the orchestrator for runtime app verification across scopes",
  "devloom-security": "DevLoom Security: callable by the orchestrator for CRUD endpoint and exposure-surface review",
  "devloom-security-senior": "DevLoom Security Senior: callable by the orchestrator for deep CRUD endpoint and exposure-surface review",
  "devloom-documenter": "DevLoom Documenter: callable by the orchestrator for documentation and state updates",
  "devloom-documenter-flash": "DevLoom Documenter Flash: callable by the orchestrator for lightweight documentation and state updates",
  "devloom-vision": "DevLoom Vision: read-only image description specialist. Takes an image, returns structured description. Nothing else.",
}

const DEFAULT_MODELS: Record<string, string> = {
  orchestrator: "opencode-go/deepseek-v4-flash",
  planner: "opencode-go/qwen3.7-max",
  developer: "opencode-go/kimi-k2.7-code",
  qa: "opencode-go/deepseek-v4-flash",
  verifier: "opencode-go/deepseek-v4-flash",
  security: "opencode-go/deepseek-v4-flash",
  documenter: "opencode-go/deepseek-v4-flash",
  vision: "opencode-go/qwen3.6-plus",
}

export function listDevloomAgents(profile: ActiveProfile | null): DevloomAgentMeta[] {
  const agents: DevloomAgentMeta[] = []
  const models = profile?.models ?? {}
  for (const [role, variants] of Object.entries(AGENT_VARIANTS)) {
    const color = ROLE_COLORS[role] ?? "#7fdbca"
    for (const variant of variants) {
      const name = `devloom-${variant}`
      const isOrchestrator = name === "devloom-orchestrator"
      agents.push({
        name,
        role,
        description: `${DESCRIPTIONS[name] ?? `DevLoom ${variant}`}${isOrchestrator ? profileLabel(profile) : ""}`,
        mode: isOrchestrator ? "all" : "subagent",
        color,
        model: models[role] ?? DEFAULT_MODELS[role] ?? "",
      })
    }
  }
  return agents
}

export interface DevloomAgentConfig {
  description?: string
  mode?: "subagent" | "primary" | "all"
  model?: string
  color?: string
  hidden?: boolean
}

export function buildAgentConfigs(rootDir: string): Record<string, DevloomAgentConfig> {
  const profile = readActiveProfile(rootDir)
  if (!profile || !profile.models) return {}
  const configs: Record<string, DevloomAgentConfig> = {}
  for (const agent of listDevloomAgents(profile)) {
    // listDevloomAgents names agents `devloom-${variant}`; recover the variant
    // so the visibility rule applies to the same string unit tests use.
    const variant = agent.name.startsWith("devloom-") ? agent.name.slice("devloom-".length) : agent.name
    configs[agent.name] = {
      description: agent.description,
      mode: agent.mode,
      model: agent.model,
      color: agent.color,
      hidden: !agentVariantVisible(profile, variant),
    }
  }
  return configs
}

export function injectDevloomAgents(
  opencodeConfig: { agent?: Record<string, DevloomAgentConfig | undefined> },
  rootDir: string
): void {
  const configs = buildAgentConfigs(rootDir)
  if (Object.keys(configs).length === 0) return
  opencodeConfig.agent = opencodeConfig.agent ?? {}
  for (const [name, agent] of Object.entries(configs)) {
    const existing = opencodeConfig.agent[name]
    opencodeConfig.agent[name] = existing
      ? { ...existing, ...agent }
      : agent
  }
}
