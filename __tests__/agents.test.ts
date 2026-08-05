import { describe, expect, test } from "@jest/globals"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import {
  readActiveProfile,
  listDevloomAgents,
  buildAgentConfigs,
  injectDevloomAgents,
  agentVariantVisible,
  profileLabel,
  type ActiveProfile,
} from "../src/agents.js"

function activeProfile(partial: Partial<ActiveProfile> = {}): ActiveProfile {
  return { profile: "go", resolvedProfile: "go", models: {}, tier: null, ...partial }
}

function makeProject(profile: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "devloom-agents-"))
  const cfgDir = join(dir, ".opencode", "devloom")
  mkdirSync(cfgDir, { recursive: true })
  writeFileSync(join(cfgDir, "config.json"), JSON.stringify(profile))
  return dir
}

/** Number of agents with hidden not set to true (visible in the sidebar/@-menu). */
function configsVisible(configs: Record<string, { hidden?: boolean }>): number {
  return Object.values(configs).filter((config) => config.hidden !== true).length
}

describe("agentVariantVisible", () => {
  test("null profile shows only base and non-tiered variants", () => {
    expect(agentVariantVisible(null, "developer")).toBe(true)
    expect(agentVariantVisible(null, "orchestrator")).toBe(true)
    expect(agentVariantVisible(null, "verifier")).toBe(true)
    expect(agentVariantVisible(null, "vision")).toBe(true)
    expect(agentVariantVisible(null, "developer-flash")).toBe(false)
    expect(agentVariantVisible(null, "developer-senior")).toBe(false)
  })

  test("flash and senior variants are hidden for every profile", () => {
    const flash = activeProfile({ profile: "go-flash", resolvedProfile: "go-flash" })
    expect(agentVariantVisible(flash, "developer-flash")).toBe(false)
    expect(agentVariantVisible(flash, "qa-flash")).toBe(false)
    expect(agentVariantVisible(flash, "documenter-flash")).toBe(false)
    expect(agentVariantVisible(flash, "developer-senior")).toBe(false)
    expect(agentVariantVisible(flash, "developer")).toBe(true)
    const senior = activeProfile({ tier: "senior" })
    expect(agentVariantVisible(senior, "developer-senior")).toBe(false)
    expect(agentVariantVisible(senior, "planner-senior")).toBe(false)
    expect(agentVariantVisible(senior, "security-senior")).toBe(false)
    expect(agentVariantVisible(senior, "developer-flash")).toBe(false)
    expect(agentVariantVisible(senior, "developer")).toBe(true)
  })

  test("non-tiered and base variants are always visible for any profile", () => {
    const profile = activeProfile({ profile: "go-economy", resolvedProfile: "go-economy" })
    expect(agentVariantVisible(profile, "orchestrator")).toBe(true)
    expect(agentVariantVisible(profile, "verifier")).toBe(true)
    expect(agentVariantVisible(profile, "vision")).toBe(true)
    expect(agentVariantVisible(profile, "security")).toBe(true)
    expect(agentVariantVisible(profile, "qa")).toBe(true)
    expect(agentVariantVisible(profile, "planner")).toBe(true)
    expect(agentVariantVisible(profile, "documenter")).toBe(true)
    expect(agentVariantVisible(profile, "developer-flash")).toBe(false)
    expect(agentVariantVisible(profile, "developer-senior")).toBe(false)
  })
})

describe("profileLabel", () => {
  test("stamps only the profile name without a tier", () => {
    expect(profileLabel(activeProfile({ profile: "go-flash", resolvedProfile: "go-flash" }))).toBe(
      " (profile: go-flash)"
    )
  })

  test("stamps profile and tier when config tier is senior", () => {
    expect(profileLabel(activeProfile({ tier: "senior" }))).toBe(" (profile: go, tier: senior)")
  })

  test("does not stamp tier for non-senior tiers", () => {
    expect(profileLabel(activeProfile({ tier: "standard" }))).toBe(" (profile: go)")
  })

  test("returns empty string without a profile", () => {
    expect(profileLabel(null)).toBe("")
    expect(profileLabel({})).toBe("")
  })
})

describe("agents.ts", () => {
  test("readActiveProfile returns null when config is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "devloom-agents-empty-"))
    try {
      expect(readActiveProfile(dir)).toBeNull()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("readActiveProfile parses go-flash profile with all 8 role models", () => {
    const dir = makeProject({
      profile: "go-flash",
      resolvedProfile: "go-flash",
      models: {
        orchestrator: "opencode-go/deepseek-v4-flash",
        planner: "opencode-go/deepseek-v4-flash",
        developer: "opencode-go/deepseek-v4-flash",
        qa: "opencode-go/deepseek-v4-flash",
        verifier: "opencode-go/deepseek-v4-flash",
        security: "opencode-go/deepseek-v4-flash",
        documenter: "opencode-go/deepseek-v4-flash",
        vision: "opencode-go/minimax-m3",
      },
    })
    try {
      const profile = readActiveProfile(dir)
      expect(profile?.profile).toBe("go-flash")
      expect(profile?.models?.developer).toBe("opencode-go/deepseek-v4-flash")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("listDevloomAgents enumerates all 15 agent variants", () => {
    const agents = listDevloomAgents(null)
    expect(agents).toHaveLength(15)
    const names = agents.map((a) => a.name)
    expect(names).toContain("devloom-orchestrator")
    expect(names).toContain("devloom-developer")
    expect(names).toContain("devloom-developer-senior")
    expect(names).toContain("devloom-developer-flash")
    expect(names).toContain("devloom-planner-senior")
    expect(names).toContain("devloom-security-senior")
  })

  test("listDevloomAgents assigns role model from profile", () => {
    const agents = listDevloomAgents({
      profile: "go-flash",
      resolvedProfile: "go-flash",
      models: { developer: "opencode-go/deepseek-v4-flash" },
    })
    const developer = agents.filter((a) => a.role === "developer")
    for (const d of developer) {
      expect(d.model).toBe("opencode-go/deepseek-v4-flash")
    }
  })

  test("orchestrator description includes the active profile", () => {
    const agents = listDevloomAgents({
      profile: "go-flash",
      resolvedProfile: "go-flash",
      models: {},
    })
    const orchestrator = agents.find((a) => a.name === "devloom-orchestrator")
    expect(orchestrator?.description).toContain("(profile: go-flash)")
  })

  test("orchestrator description uses resolvedProfile when profile is auto", () => {
    const agents = listDevloomAgents({
      profile: "auto",
      resolvedProfile: "free",
      models: {},
    })
    const orchestrator = agents.find((a) => a.name === "devloom-orchestrator")
    expect(orchestrator?.description).toContain("(profile: free)")
  })

  test("orchestrator description has no profile suffix without a profile", () => {
    const orchestrator = listDevloomAgents(null).find((a) => a.name === "devloom-orchestrator")
    expect(orchestrator?.description).toBe("DevLoom Orchestrator: autonomous multi-agent delivery")
  })

  test("subagent descriptions are not suffixed with the profile", () => {
    const agents = listDevloomAgents({
      profile: "go-flash",
      resolvedProfile: "go-flash",
      models: {},
    })
    for (const agent of agents) {
      if (agent.name === "devloom-orchestrator") continue
      expect(agent.description).not.toContain("(profile:")
    }
  })

  test("buildAgentConfigs produces configs with model, color, mode, hidden:false", () => {
    const dir = makeProject({
      profile: "go-flash",
      resolvedProfile: "go-flash",
      models: {
        developer: "opencode-go/deepseek-v4-flash",
        planner: "opencode-go/deepseek-v4-flash",
      },
    })
    try {
      const configs = buildAgentConfigs(dir)
      expect(Object.keys(configs)).toHaveLength(15)
      expect(configs["devloom-developer"]?.model).toBe("opencode-go/deepseek-v4-flash")
      expect(configs["devloom-developer"]?.mode).toBe("subagent")
      expect(configs["devloom-orchestrator"]?.mode).toBe("all")
      expect(configs["devloom-orchestrator"]?.color).toBe("#7fdbca")
      expect(configs["devloom-developer"]?.hidden).toBe(false)
      expect(configs["devloom-developer"]?.description).toContain("DevLoom Developer")
      expect(configs["devloom-orchestrator"]?.description).toContain("(profile: go-flash)")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("buildAgentConfigs sets hidden flags per profile while keeping all 15 configs", () => {
    const dir = makeProject({
      profile: "go-flash",
      resolvedProfile: "go-flash",
      models: {
        developer: "opencode-go/deepseek-v4-flash",
        planner: "opencode-go/deepseek-v4-flash",
      },
    })
    try {
      const configs = buildAgentConfigs(dir)
      expect(Object.keys(configs)).toHaveLength(15)
      // Base-only: 8 visible (orchestrator + 7 base); flash and senior hidden.
      expect(configsVisible(configs)).toBe(8)
      expect(configs["devloom-developer"]?.hidden).toBe(false)
      expect(configs["devloom-developer-flash"]?.hidden).toBe(true)
      expect(configs["devloom-developer-senior"]?.hidden).toBe(true)
      expect(configs["devloom-planner-flash"]?.hidden).toBe(true)
      expect(configs["devloom-orchestrator"]?.hidden).toBe(false)
      expect(configs["devloom-verifier"]?.hidden).toBe(false)
      expect(configs["devloom-security-senior"]?.hidden).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("buildAgentConfigs hides flash and senior variants for go without tier", () => {
    const dir = makeProject({
      profile: "go",
      resolvedProfile: "go",
      tier: null,
      models: { developer: "opencode-go/kimi-k2.7-code" },
    })
    try {
      const configs = buildAgentConfigs(dir)
      expect(Object.keys(configs)).toHaveLength(15)
      // AC2: go without tier shows 8 base only; flash AND senior hidden.
      expect(configsVisible(configs)).toBe(8)
      expect(configs["devloom-developer"]?.hidden).toBe(false)
      expect(configs["devloom-developer-flash"]?.hidden).toBe(true)
      expect(configs["devloom-developer-senior"]?.hidden).toBe(true)
      expect(configs["devloom-orchestrator"]?.hidden).toBe(false)
      expect(configs["devloom-planner-flash"]?.hidden).toBe(true)
      expect(configs["devloom-security-senior"]?.hidden).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("buildAgentConfigs hides flash but keeps senior for go + senior tier", () => {
    const dir = makeProject({
      profile: "go",
      resolvedProfile: "go",
      tier: "senior",
      models: { developer: "opencode-go/kimi-k3" },
    })
    try {
      const configs = buildAgentConfigs(dir)
      expect(Object.keys(configs)).toHaveLength(15)
      // Base-only for every profile: 8 visible; senior and flash both hidden.
      expect(configsVisible(configs)).toBe(8)
      expect(configs["devloom-developer-senior"]?.hidden).toBe(true)
      expect(configs["devloom-planner-senior"]?.hidden).toBe(true)
      expect(configs["devloom-security-senior"]?.hidden).toBe(true)
      expect(configs["devloom-developer-flash"]?.hidden).toBe(true)
      expect(configs["devloom-developer"]?.hidden).toBe(false)
      expect(configs["devloom-orchestrator"]?.hidden).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("injectDevloomAgents merges into existing opencode config agent map", () => {
    const dir = makeProject({
      profile: "go-flash",
      models: { developer: "opencode-go/deepseek-v4-flash" },
    })
    try {
      const cfg: { agent?: Record<string, any> } = {
        agent: { "devloom-developer": { model: "stale/old-model", prompt: "KEEP" } },
      }
      injectDevloomAgents(cfg, dir)
      expect(cfg.agent?.["devloom-developer"]?.model).toBe("opencode-go/deepseek-v4-flash")
      expect(cfg.agent?.["devloom-developer"]?.prompt).toBe("KEEP")
      expect(cfg.agent?.["devloom-orchestrator"]).toBeTruthy()
      expect(cfg.agent?.["devloom-vision"]?.model).toBe("opencode-go/qwen3.6-plus")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("injectDevloomAgents is a no-op without a profile config", () => {
    const dir = mkdtempSync(join(tmpdir(), "devloom-agents-none-"))
    try {
      const cfg: { agent?: Record<string, any> } = { agent: {} }
      injectDevloomAgents(cfg, dir)
      expect(Object.keys(cfg.agent ?? {})).toHaveLength(0)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("injectDevloomAgents overrides existing opencode agent model with profile", () => {
    const dir = makeProject({
      profile: "go-flash",
      models: { developer: "opencode-go/deepseek-v4-flash" },
    })
    try {
      const cfg: { agent?: Record<string, any> } = {
        agent: { "devloom-developer": { model: "opencode-go/kimi-k3", prompt: "custom" } },
      }
      injectDevloomAgents(cfg, dir)
      expect(cfg.agent?.["devloom-developer"]?.model).toBe("opencode-go/deepseek-v4-flash")
      expect(cfg.agent?.["devloom-developer"]?.prompt).toBe("custom")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("injectDevloomAgents keeps all 15 agents with hidden flags per profile", () => {
    const dir = makeProject({
      profile: "go-flash",
      resolvedProfile: "go-flash",
      models: { developer: "opencode-go/deepseek-v4-flash" },
    })
    try {
      const cfg: { agent?: Record<string, any> } = {}
      injectDevloomAgents(cfg, dir)
      expect(Object.keys(cfg.agent ?? {})).toHaveLength(15)
      expect(cfg.agent?.["devloom-developer-senior"]?.hidden).toBe(true)
      expect(cfg.agent?.["devloom-developer-flash"]?.hidden).toBe(true)
      expect(cfg.agent?.["devloom-developer"]?.hidden).toBe(false)
      expect(cfg.agent?.["devloom-orchestrator"]?.hidden).toBe(false)
      expect(cfg.agent?.["devloom-orchestrator"]?.description).toContain("(profile: go-flash)")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
