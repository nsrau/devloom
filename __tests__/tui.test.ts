import { jest, describe, expect, test } from "@jest/globals"
import {
  DEVOOM_AGENT_PREFIX,
  ORCHESTRATOR_AGENT_NAME,
  buildSidebarAgentViews,
  extractProfileLabel,
  extractTierLabel,
  formatAgentModel,
  type SidebarAgent,
} from "../src/tui-agents.js"

function agent(partial: Partial<SidebarAgent> & { name: string }): SidebarAgent {
  return { description: "desc", mode: "subagent", color: "#ffffff", model: "opencode-go/deepseek-v4-flash", ...partial }
}

function devloomAgent(name: string): SidebarAgent {
  return agent({ name })
}

describe("extractProfileLabel", () => {
  test("returns the profile name from an orchestrator description", () => {
    expect(extractProfileLabel("DevLoom Orchestrator: autonomous multi-agent delivery (profile: go-flash)")).toBe(
      "go-flash"
    )
  })

  test("extracts only the profile part of an extended label", () => {
    expect(extractProfileLabel("DevLoom Orchestrator: autonomous multi-agent delivery (profile: go, tier: senior)")).toBe(
      "go"
    )
  })

  test("returns null when the description has no profile marker", () => {
    expect(extractProfileLabel("DevLoom Developer: plain description")).toBeNull()
  })

  test("returns null for missing description", () => {
    expect(extractProfileLabel(undefined)).toBeNull()
  })
})

describe("extractTierLabel", () => {
  test("returns the tier from an extended orchestrator label", () => {
    expect(extractTierLabel("DevLoom Orchestrator: autonomous multi-agent delivery (profile: go, tier: senior)")).toBe(
      "senior"
    )
  })

  test("returns null when no tier marker is present", () => {
    expect(extractTierLabel("DevLoom Orchestrator: autonomous multi-agent delivery (profile: go-flash)")).toBeNull()
  })

  test("returns null for missing description", () => {
    expect(extractTierLabel(undefined)).toBeNull()
  })
})

describe("buildSidebarAgentViews", () => {
  test("filters to devloom agents and keeps the orchestrator first", () => {
    const view = buildSidebarAgentViews([
      agent({ name: "devloom-developer", color: "#addb67" }),
      agent({
        name: ORCHESTRATOR_AGENT_NAME,
        description: "DevLoom Orchestrator: autonomous multi-agent delivery (profile: go-flash)",
        color: "#7fdbca",
        mode: "all",
      }),
      agent({ name: "build", color: "#000000" }),
      agent({ name: "devloom-qa", color: "#ecc48d" }),
    ])
    expect(view.total).toBe(3)
    expect(view.orchestrator?.name).toBe(ORCHESTRATOR_AGENT_NAME)
    expect(view.orchestrator?.profileLabel).toBe("go-flash")
    expect(view.orchestrator?.mode).toBe("all")
    expect(view.others.map((v) => v.name)).toEqual(["devloom-developer", "devloom-qa"])
    expect(view.others.every((v) => v.profileLabel === null)).toBe(true)
  })

  test("sorts non-orchestrator agents by name", () => {
    const view = buildSidebarAgentViews([
      agent({ name: "devloom-qa" }),
      agent({ name: "devloom-developer" }),
      agent({ name: "devloom-planner" }),
    ])
    expect(view.others.map((v) => v.name)).toEqual(["devloom-developer", "devloom-planner", "devloom-qa"])
  })

  test("handles an empty or non-devloom list without throwing", () => {
    expect(buildSidebarAgentViews([]).total).toBe(0)
    const onlyForeign = buildSidebarAgentViews([agent({ name: "build" }), agent({ name: "plan" })])
    expect(onlyForeign.total).toBe(0)
    expect(onlyForeign.orchestrator).toBeNull()
    expect(onlyForeign.others).toEqual([])
  })

  test("flash and senior variants are always dropped for any profile", () => {
    const agents = [
      devloomAgent("devloom-planner"),
      devloomAgent("devloom-planner-flash"),
      devloomAgent("devloom-planner-senior"),
      agent({
        name: ORCHESTRATOR_AGENT_NAME,
        description: "DevLoom Orchestrator: autonomous multi-agent delivery (profile: go-flash)",
      }),
    ]
    const view = buildSidebarAgentViews(agents, "go-flash")
    expect(view.orchestrator?.name).toBe(ORCHESTRATOR_AGENT_NAME)
    expect(view.others.map((v) => v.name)).toEqual(["devloom-planner"])
    expect(view.total).toBe(2)
  })

  test("go without tier drops flash and senior variants", () => {
    const view = buildSidebarAgentViews(
      [
        devloomAgent("devloom-developer"),
        devloomAgent("devloom-developer-flash"),
        devloomAgent("devloom-developer-senior"),
      ],
      "go"
    )
    expect(view.others.map((v) => v.name)).toEqual(["devloom-developer"])
    expect(view.total).toBe(1)
  })

  test("free profile drops flash and senior variants", () => {
    const view = buildSidebarAgentViews(
      [devloomAgent("devloom-qa"), devloomAgent("devloom-qa-flash"), devloomAgent("devloom-security-senior")],
      "free"
    )
    expect(view.others.map((v) => v.name)).toEqual(["devloom-qa"])
    expect(view.total).toBe(1)
  })

  test("go profile with senior tier still drops flash and senior variants", () => {
    const view = buildSidebarAgentViews([
      devloomAgent("devloom-developer"),
      devloomAgent("devloom-developer-flash"),
      devloomAgent("devloom-developer-senior"),
    ])
    expect(view.others.map((v) => v.name)).toEqual(["devloom-developer"])
    expect(view.total).toBe(1)
  })

  test("derives the profile from the orchestrator label when no args are given", () => {
    const view = buildSidebarAgentViews([
      devloomAgent("devloom-developer"),
      devloomAgent("devloom-developer-flash"),
      agent({
        name: ORCHESTRATOR_AGENT_NAME,
        description: "DevLoom Orchestrator: autonomous multi-agent delivery (profile: go-flash)",
      }),
    ])
    expect(view.orchestrator?.profileLabel).toBe("go-flash")
    expect(view.profile).toBe("go-flash")
    const names = [view.orchestrator?.name, ...view.others.map((v) => v.name)].filter(Boolean)
    expect(names).toEqual([ORCHESTRATOR_AGENT_NAME, "devloom-developer"])
  })

  test("derives profile and tier from the extended orchestrator label", () => {
    const view = buildSidebarAgentViews([
      devloomAgent("devloom-developer"),
      devloomAgent("devloom-developer-flash"),
      devloomAgent("devloom-developer-senior"),
      agent({
        name: ORCHESTRATOR_AGENT_NAME,
        description: "DevLoom Orchestrator: autonomous multi-agent delivery (profile: go, tier: senior)",
      }),
    ])
    expect(view.orchestrator?.profileLabel).toBe("go")
    const names = [view.orchestrator?.name, ...view.others.map((v) => v.name)].filter(Boolean)
    expect(names).toEqual([ORCHESTRATOR_AGENT_NAME, "devloom-developer"])
  })

  test("exposes the active profile and each agent model", () => {
    const view = buildSidebarAgentViews([
      devloomAgent("devloom-qa"),
      agent({
        name: ORCHESTRATOR_AGENT_NAME,
        description: "DevLoom Orchestrator: autonomous multi-agent delivery (profile: go-flash)",
        model: "opencode-go/deepseek-v4-flash",
      }),
      agent({ name: "devloom-planner", model: "opencode-go/qwen3.7-max" }),
    ])
    expect(view.profile).toBe("go-flash")
    expect(view.orchestrator?.model).toBe("opencode-go/deepseek-v4-flash")
    expect(view.others.find((v) => v.name === "devloom-planner")?.model).toBe("opencode-go/qwen3.7-max")
  })

  test("formatAgentModel handles string and SDK model objects", () => {
    expect(formatAgentModel("opencode-go/deepseek-v4-flash")).toBe("opencode-go/deepseek-v4-flash")
    expect(formatAgentModel({ providerID: "opencode-go", modelID: "deepseek-v4-flash" })).toBe(
      "opencode-go/deepseek-v4-flash"
    )
    expect(formatAgentModel(undefined)).toBe("")
  })

  test("falls back to the orchestrator color when color is missing", () => {
    const view = buildSidebarAgentViews([agent({ name: ORCHESTRATOR_AGENT_NAME, color: undefined })])
    expect(view.orchestrator?.color).toBe("#7fdbca")
  })

  test("prefix constant matches the agents the plugin injects", () => {
    expect(DEVOOM_AGENT_PREFIX).toBe("devloom-")
  })
})
