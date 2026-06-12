import { describe, expect, test } from "@jest/globals"
import { readFileSync, readdirSync } from "fs"
import { join } from "path"

const read = (path: string) => readFileSync(path, "utf8")

const AGENTS_DIR = "agents"
const AGENT_FILES = readdirSync(AGENTS_DIR).filter((f) => f.startsWith("devloom-") && f.endsWith(".md"))

const ALL_AGENT_NAMES = [
  "orchestrator", "analyst", "architect", "developer", "qa", "documenter",
  "explorer", "route-verifier", "form-verifier", "a11y-verifier", "api-verifier",
  "security", "journey-agent", "rca", "repair", "regression", "recovery"
]

describe("DevLoom operating standard", () => {
  test("package ships workflow assets", () => {
    const pkg = JSON.parse(read("package.json")) as { files: string[] }
    expect(pkg.files).toEqual(expect.arrayContaining([".ai", "skills", "protocol", "project"]))
  })

  test("project protocol requires English, source verification, and tests", () => {
    const protocol = read("protocol/project-system.md")
    expect(protocol).toContain("EN")
    expect(protocol).toContain("tests+regr required")
    expect(protocol).toContain("append each new prompt as the last task/todo")
    expect(read("protocol/agent-contracts.md")).toContain("LatestStableCheck")
  })

  test("protocol includes model-routing documentation", () => {
    const routing = read("protocol/model-routing.md")
    expect(routing).toContain("go-premium")
    expect(routing).toContain("go-economy")
    expect(routing).toContain("free")
    expect(routing).toContain("GLM 5.1")
    expect(routing).toContain("Kimi K2.6")
    expect(routing).toContain("DeepSeek V4 Pro")
  })

  test("project standard documents the persistent workspace", () => {
    const standard = read("project/README.md")
    expect(standard).toContain(".opencode/devloom/project/")
    expect(standard).toContain("JSONM")
    expect(standard).toContain("GitHub Project mirror")
  })

  test("init command bootstraps project workspace", () => {
    const initCommand = read("commands/devloom-init.md")
    expect(initCommand).toContain("mkdir -p .opencode/devloom/project")
    expect(initCommand).toContain("board.json")
    expect(initCommand).toContain("tracker: 'local'")
    expect(initCommand).toContain("tasks/TODO.md")
    expect(initCommand).toContain("auto")
    expect(initCommand).toContain("INIT_PROFILE")
  })

  test("main command references board persistence and profile support", () => {
    const command = read("commands/devloom.md")
    expect(command).toContain(".opencode/devloom/project/board.json")
    expect(command).toContain("English-only")
    expect(command).toContain("normalize existing project files")
    expect(command).toContain("append every prompt as the last task/todo")
    expect(command).toContain("go-premium")
    expect(command).toContain("go-economy")
    expect(command).toContain("profile")
  })

  test("orchestrator agent enforces per-turn delegation protocol", () => {
    const orchestrator = read("agents/devloom-orchestrator.md")
    expect(orchestrator).toContain("Per-turn protocol")
    expect(orchestrator).toContain("DEVLOOM_DONE")
    expect(orchestrator).toContain("Self-check before replying")
  })

  test("save command persists state and pauses", () => {
    const command = read("commands/devloom-save.md")
    expect(command).toContain("next=user-command")
    expect(command).toContain("Pause")
    expect(command).toContain("state persisted")
  })

  test("devloom-init creates config with profile field", () => {
    const init = read("commands/devloom-init.md")
    expect(init).toContain("profile")
    expect(init).toContain("INIT_PROFILE")
    expect(init).toContain("auto")
  })
})

describe("Agent file standards", () => {
  test("all 17 agent files exist", () => {
    expect(AGENT_FILES.length).toBe(17)
  })

  test.each(ALL_AGENT_NAMES)("agent devloom-%s has a model field", (name) => {
    const content = read(join(AGENTS_DIR, `devloom-${name}.md`))
    expect(content).toMatch(/^model: opencode(-go)?\//m)
  })

  test.each(ALL_AGENT_NAMES)("agent devloom-%s has a description", (name) => {
    const content = read(join(AGENTS_DIR, `devloom-${name}.md`))
    expect(content).toMatch(/^description: /m)
  })

  test.each(ALL_AGENT_NAMES)("agent devloom-%s has ENGLISH ONLY instruction", (name) => {
    const content = read(join(AGENTS_DIR, `devloom-${name}.md`))
    expect(content).toContain("ENGLISH ONLY")
  })

  test.each(ALL_AGENT_NAMES)("agent devloom-%s has OUTPUT contract", (name) => {
    const content = read(join(AGENTS_DIR, `devloom-${name}.md`))
    expect(content).toMatch(/^OUT: /m)
  })

  test.each([
    "analyst", "architect", "developer", "qa", "documenter",
    "explorer", "route-verifier", "form-verifier", "a11y-verifier",
    "api-verifier", "security", "journey-agent", "rca", "repair", "regression",
    "recovery"
  ])("subagent devloom-%s is hidden with subagent mode", (name) => {
    const content = read(join(AGENTS_DIR, `devloom-${name}.md`))
    expect(content).toMatch(/^mode: subagent/m)
    expect(content).toMatch(/^hidden: true/m)
  })

  test("orchestrator agent is primary (not subagent) with task permission", () => {
    const content = read(join(AGENTS_DIR, "devloom-orchestrator.md"))
    expect(content).not.toMatch(/^mode: subagent/m)
    expect(content).not.toMatch(/^hidden: true/m)
    expect(content).toContain("task: allow")
    expect(content).toContain("ask: allow")
  })

  test("all agent models are valid OpenCode model strings", () => {
    for (const name of ALL_AGENT_NAMES) {
      const content = read(join(AGENTS_DIR, `devloom-${name}.md`))
      const match = content.match(/^model: (.+)$/m)
      expect(match).toBeTruthy()
      const model = match![1]
      expect(model).toMatch(/^opencode(-go)?\//)
      expect(model).not.toMatch(/\s/)
    }
  })
})

describe("Profile definitions", () => {
  test("config profile is go", () => {
    const config = JSON.parse(read(".opencode/devloom/config.json"))
    expect(config.profile).toBe("go")
    expect(config.models.orchestrator).toBe("opencode-go/glm-5.1")
  })

  test("command devloom.md defines go-premium, go-economy, free profiles", () => {
    const command = read("commands/devloom.md")
    expect(command).toContain("go-premium")
    expect(command).toContain("go-economy")
    expect(command).toContain("free")
  })

  test("model prefix normalization is implemented", () => {
    const command = read("commands/devloom.md")
    expect(command).toContain("auto-adding opencode/")
    expect(command).toContain("startsWith('opencode/')")
  })

  test("local model overrides win over profile defaults", () => {
    const command = read("commands/devloom.md")
    expect(command).toContain("...profileModels, ...(c.models || {})")
  })
})

describe("README and GUIDE consistency", () => {
  test("README mentions all 17 agents", () => {
    const readme = read("README.md")
    for (const name of ALL_AGENT_NAMES) {
      expect(readme).toContain(name)
    }
  })

  test("GUIDE mentions all 17 agents", () => {
    const guide = read("GUIDE.md")
    for (const name of ALL_AGENT_NAMES) {
      expect(guide).toContain(name)
    }
  })

  test("README and GUIDE mention three profiles", () => {
    const readme = read("README.md")
    const guide = read("GUIDE.md")
    expect(readme).toContain("go")
    expect(guide).toContain("go")
    expect(guide).toContain("go-economy")
    expect(guide).toContain("free")
  })

  test("READ ME has OpenCode Go Optimization section", () => {
    const readme = read("README.md")
    expect(readme).toContain("OpenCode Go")
  })
})

describe("Profile command files", () => {
  const PROFILE_COMMANDS = ["devloom-auto", "devloom-go", "devloom-go-economy", "devloom-free", "devloom-plan"]

  test.each(PROFILE_COMMANDS)("command /%s exists and references profile.mjs", (name) => {
    const content = read(`commands/${name}.md`)
    expect(content).toContain("profile.mjs")
  })

  test.each(PROFILE_COMMANDS)("command /%s has frontmatter block", (name) => {
    const content = read(`commands/${name}.md`)
    expect(content).toMatch(/^---\n.*\n---/ms)
  })

  test("all profile command files exist", () => {
    for (const name of PROFILE_COMMANDS) {
      expect(() => read(`commands/${name}.md`)).not.toThrow()
    }
  })

  test("devloom-go uses premium model in frontmatter", () => {
    const content = read("commands/devloom-go.md")
    expect(content).toContain("opencode-go/glm-5.1")
  })

  test("devloom-free uses free model in frontmatter", () => {
    const content = read("commands/devloom-free.md")
    expect(content).toContain("opencode/")
    expect(content).toContain("free")
  })

  test("devloom-auto does not hardcode a profile", () => {
    const auto = read("commands/devloom-auto.md")
    expect(auto).toContain("auto")
  })
})

describe("Profile manager (scripts/profile.mjs)", () => {
  test("profile manager script exists", () => {
    expect(() => read("scripts/profile.mjs")).not.toThrow()
  })

  test("profile manager has all profile definitions for go", () => {
    const pm = read("scripts/profile.mjs")
    expect(pm).toContain("PROFILES")
    expect(pm).toContain("go")
    expect(pm).toContain("go-economy")
    expect(pm).toContain("FREE_CANDIDATES_BY_ROLE")
    expect(pm).toContain("FREE_ROLE_MAP")
  })

  test("profile manager defines set, current, validate, apply, detect commands", () => {
    const pm = read("scripts/profile.mjs")
    expect(pm).toContain("set")
    expect(pm).toContain("current")
    expect(pm).toContain("validate")
    expect(pm).toContain("apply")
    expect(pm).toContain("detect")
  })

  test("profile manager has model prefix validation", () => {
    const pm = read("scripts/profile.mjs")
    expect(pm).toContain("opencode/")
    expect(pm).toContain("opencode-go/")
  })
})

describe("Profile detection and fallback behavior", () => {
  test("all go profile agents have valid model ids", () => {
    const pm = read("scripts/profile.mjs")
    // Verify all 16 agents are in the go profile
    const lines = pm.split("\n")
    const goSectionStart = lines.findIndex(l => l.includes("go:"))
    let goModels = 0
    for (let i = goSectionStart; i < lines.length && !lines[i].includes("go-economy"); i++) {
      if (lines[i].includes("opencode-go/")) goModels++
    }
    expect(goModels).toBeGreaterThanOrEqual(16)
  })

  test("configuration stores resolved profile metadata", () => {
    const config = JSON.parse(read(".opencode/devloom/config.json"))
    expect(config).toHaveProperty("profile")
    expect(config).toHaveProperty("resolvedProfile")
    expect(config).toHaveProperty("resolvedAt")
    expect(config).toHaveProperty("models")
    expect(config).toHaveProperty("overrides")
    expect(config).toHaveProperty("availableModelsSnapshot")
  })

  test("free profile has all 16 agents mapped", () => {
    const pm = read("scripts/profile.mjs")
    // Count all FREE_ROLE_MAP entries
    const roleLines = pm.split("\n").filter(l => l.includes("FREE_ROLE_MAP")).length
    expect(roleLines).toBeGreaterThan(0)
    const freeRoles = pm.match(/"[a-z-]+": "planning|implementation|verification|documentation"/g)
    expect(freeRoles).not.toBeNull()
    expect(freeRoles!.length).toBeGreaterThanOrEqual(16)
  })
})

describe("Package and build", () => {
  test("package.json includes scripts dir in files", () => {
    const pkg = JSON.parse(read("package.json"))
    expect(pkg.files).toEqual(expect.arrayContaining(["scripts"]))
  })

  test("postinstall copies profile manager", () => {
    const pi = read("postinstall.mjs")
    expect(pi).toContain("Installing profile manager scripts")
    expect(pi).toContain("devloom-scripts")
  })
})
