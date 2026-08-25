import { jest, describe, expect, test, beforeEach, afterEach } from "@jest/globals"
import { homedir } from "os"

const HOME = homedir()
const AGENTS_DIR = `${HOME}/.config/opencode/agents`
const CONFIG_PATH = ".opencode/devloom/config.json"

const ALL_GO_MODELS = [
  "opencode-go/glm-5.2",
  "opencode-go/kimi-k2.7-code",
  "opencode-go/deepseek-v4-pro",
  "opencode-go/deepseek-v4-flash",
  "opencode-go/qwen3.6-plus",
  "opencode-go/qwen3.7-plus",
  "opencode-go/qwen3.7-max",
  "opencode-go/mimo-v2.5",
  "opencode-go/mimo-v2.5-pro",
  "opencode-go/minimax-m3",
]

const ALL_FREE_MODELS = [
  "opencode/x-preview-f-free",
  "opencode/big-pickle",
  "opencode/nemotron-3-ultra-free",
  "opencode/nemotron-3.5-lightning-free",
  "opencode/mimo-v2.5-free",
  "opencode/hy3-free",
  "opencode/muse-spark-1.2-contributor-free",
]

const DEAD_FREE_MODELS = [
  "opencode/deepseek-v4-flash-free",
  "opencode/north-mini-code-free",
  "opencode/laguna-s-2.1-free",
  "opencode/ling-3.0-flash-free",
  "opencode/longcat-2.0-free",
]

const ALL_MODELS = [...ALL_GO_MODELS, ...ALL_FREE_MODELS]

let mockAvailable: string[] = []
let writtenFiles: Record<string, string> = {}
let mockDirs: Record<string, string[]> = {}
let mockExitError: Error | null = null

jest.unstable_mockModule("child_process", () => ({
  execSync: (cmd: string) => {
    if (cmd.startsWith("opencode models")) return mockAvailable.join("\n")
    if (cmd.startsWith("chmod")) return ""
    return ""
  },
  execFileSync: () => "",
}))

jest.unstable_mockModule("fs", () => ({
  readFileSync: (p: string, enc?: string) => {
    if (writtenFiles[p] !== undefined) return writtenFiles[p]
    throw new Error("ENOENT")
  },
  writeFileSync: (p: string, c: string) => {
    writtenFiles[p] = c
  },
  existsSync: (p: string) => (p in writtenFiles) || (p in mockDirs),
  mkdirSync: () => {},
  readdirSync: (p: string) => mockDirs[p] ?? [],
  cpSync: () => {},
  copyFileSync: (src: string, dest: string) => {
    // Mimic real copying so refresh effects are observable via writtenFiles.
    if (writtenFiles[src] !== undefined) writtenFiles[dest] = writtenFiles[src]
  },
  rmSync: () => {},
  statSync: () => ({ isDirectory: () => false }),
}))

jest.unstable_mockModule("os", () => ({
  homedir: () => HOME,
  platform: () => "linux",
}))

describe("profile.mjs", () => {
  let exitSpy: jest.SpyInstance

  beforeEach(async () => {
    jest.resetModules()
    mockAvailable = [...ALL_MODELS]
    writtenFiles = {}
    mockExitError = new Error("__EXIT__")
    exitSpy = jest.spyOn(process, "exit").mockImplementation((code?: string | number | null | undefined) => {
      throw mockExitError
    })
  })

  afterEach(() => {
    exitSpy.mockRestore()
  })

  async function importProfile() {
    return await import("../scripts/profile.mjs")
  }

  test("cmdSet('free') resolves all 8 agents to models", async () => {
    const profile = await importProfile()
    const config = profile.cmdSet("free")
    expect(Object.keys(config.models)).toHaveLength(8)
    expect(config.models.orchestrator).toBe("opencode/x-preview-f-free")
    for (const [role, model] of Object.entries(config.models) as [string, string][]) {
      if (role === "vision") {
        // no general free chat fallback: vision role requires a vision-capable model
        expect(model).toMatch(/^opencode(-go)?\//);
      } else {
        expect(model).toMatch(/^(opencode\/.*-free|opencode\/big-pickle)$/)
      }
    }
  })

  test("free candidate chains reference only live catalog models", async () => {
    const profile = await importProfile()
    for (const [role, chain] of Object.entries(profile.FREE_CANDIDATES_BY_ROLE) as [string, string[]][]) {
      expect(chain.length).toBeGreaterThan(0)
      for (const id of chain) {
        for (const dead of DEAD_FREE_MODELS) {
          expect(`${role} -> ${id}`).not.toContain(dead)
        }
      }
    }
    const visionChain = (profile.FREE_CANDIDATES_BY_ROLE as Record<string, string[]>).vision
    expect(visionChain[0]).toBe("opencode/mimo-v2.5-free")
    expect(visionChain.every((id) => id.startsWith("opencode/") || id.startsWith("opencode-go/"))).toBe(true)
  })

  test("cmdSet('go') assigns correct go models without fallback", async () => {
    const profile = await importProfile()
    const config = profile.cmdSet("go")
    expect(config.models.orchestrator).toBe("opencode-go/deepseek-v4-flash")
    expect(config.models.planner).toBe("opencode-go/qwen3.7-max")
    expect(config.models.developer).toBe("opencode-go/kimi-k2.7-code")
    expect(config.models.qa).toBe("opencode-go/deepseek-v4-pro")
    expect(config.models.security).toBe("opencode-go/glm-5.2")
    expect(config.models.documenter).toBe("opencode-go/qwen3.7-plus")
    expect(config.models.vision).toBe("opencode-go/minimax-m3")
    expect(Object.keys(config.fallbacks || {})).toHaveLength(0)
  })

  test("cmdSet('go-flash') assigns flash to all 8 agents (vision uses multimodal)", async () => {
    const profile = await importProfile()
    const config = profile.cmdSet("go-flash")
    expect(Object.keys(config.models)).toHaveLength(8)
    for (const [role, model] of Object.entries(config.models) as [string, string][]) {
      if (role === "vision") {
        expect(model).toMatch(/^opencode(-go)?\// )
      } else {
        expect(model).toBe("opencode-go/deepseek-v4-flash")
      }
    }
  })

  test("cmdSet('deepseek') assigns correct deepseek models", async () => {
    const profile = await importProfile()
    const config = profile.cmdSet("deepseek")
    expect(config.models.orchestrator).toBe("opencode-go/deepseek-v4-pro")
    expect(config.models.verifier).toBe("opencode-go/deepseek-v4-flash")
  })

  test("cmdSet('auto') resolves to go-flash when go models are available", async () => {
    const profile = await importProfile()
    const config = profile.cmdSet("auto")
    expect(config.resolvedProfile).toBe("go-flash")
  })

  test("cmdSet('auto') resolves to free when go models are unavailable", async () => {
    mockAvailable = [...ALL_FREE_MODELS]
    const profile = await importProfile()
    const config = profile.cmdSet("auto")
    expect(config.resolvedProfile).toBe("free")
  })

  test("cmdSet('bogus') exits with error for unknown profile", async () => {
    const profile = await importProfile()
    expect(() => profile.cmdSet("bogus")).toThrow("__EXIT__")
  })

  test("cmdCurrent() logs current profile after cmdSet('go')", async () => {
    const profile = await importProfile()
    profile.cmdSet("go")
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    profile.cmdCurrent()
    expect(logSpy).toHaveBeenCalledWith("Profile: go")
    logSpy.mockRestore()
  })

  test("availableModelsSnapshot contains no duplicates", async () => {
    mockAvailable = [...ALL_MODELS, "opencode/big-pickle"]
    const profile = await importProfile()
    const config = profile.cmdSet("free")
    const snapshot = config.availableModelsSnapshot as string[]
    expect(snapshot).toContain("opencode/big-pickle")
    expect(new Set(snapshot).size).toBe(snapshot.length)
  })

  test("applyModelsToAgentFiles updates model line and preserves content", async () => {
    const agentPath = `${AGENTS_DIR}/devloom-orchestrator.md`
    writtenFiles[agentPath] = "model: old-model\n# Orchestrator\n"
    const profile = await importProfile()
    profile.applyModelsToAgentFiles({ orchestrator: "opencode-go/glm-5.2" })
    const content = writtenFiles[agentPath]
    expect(content).toContain("model: opencode-go/glm-5.2")
    expect(content).toContain("# Orchestrator")
    expect(content).not.toContain("model: old-model")
  })

  test("cmdSet('go') falls back developer when go model is missing", async () => {
    mockAvailable = ALL_MODELS.filter((m) => m !== "opencode-go/kimi-k2.7-code")
    const profile = await importProfile()
    const config = profile.cmdSet("go")
    expect(config.models.developer).toMatch(/^(opencode\/.*-free|opencode\/big-pickle)$/)
    expect(config.fallbacks).toHaveProperty("developer")
    expect(config.fallbacks.developer.from).toBe("opencode-go/kimi-k2.7-code")
    expect(config.fallbacks.developer.to).toBe(config.models.developer)
  })

  test("edge: empty available models — go exits, free returns defaults", async () => {
    mockAvailable = []
    const profile = await importProfile()
    expect(() => profile.cmdSet("go")).toThrow("__EXIT__")

    jest.resetModules()
    mockAvailable = []
    writtenFiles = {}
    exitSpy = jest.spyOn(process, "exit").mockImplementation((code?: string | number | null | undefined) => {
      throw mockExitError
    })
    const profile2 = await importProfile()
    const config = profile2.cmdSet("free")
    expect(Object.keys(config.models)).toHaveLength(8)
    for (const [, model] of Object.entries(config.models) as [string, string][]) {
      expect(model).toBeTruthy()
    }
  })

  test("edge: only unrelated models — free returns defaults", async () => {
    mockAvailable = ["lmstudio/foo"]
    const profile = await importProfile()
    const config = profile.cmdSet("free")
    expect(Object.keys(config.models)).toHaveLength(8)
    for (const [, model] of Object.entries(config.models) as [string, string][]) {
      expect(model).toBeTruthy()
    }
  })

  test("applyModelsToAgentFiles propagates model to all variants (senior, flash)", async () => {
    const base = `${AGENTS_DIR}/devloom-developer.md`
    const flash = `${AGENTS_DIR}/devloom-developer-flash.md`
    const senior = `${AGENTS_DIR}/devloom-developer-senior.md`
    writtenFiles[base] = "model: old-base\n"
    writtenFiles[flash] = "model: old-flash\n"
    writtenFiles[senior] = "model: old-senior\n"
    const profile = await importProfile()
    profile.applyModelsToAgentFiles({ developer: "opencode-go/deepseek-v4-flash" })
    expect(writtenFiles[base]).toContain("model: opencode-go/deepseek-v4-flash")
    expect(writtenFiles[flash]).toContain("model: opencode-go/deepseek-v4-flash")
    expect(writtenFiles[senior]).toContain("model: opencode-go/deepseek-v4-flash")
  })

  test("go-flash profile: all agent files (including senior variants) get v4-flash", async () => {
    const agentFiles = [
      "orchestrator", "planner", "planner-flash", "planner-senior",
      "developer", "developer-flash", "developer-senior",
      "qa", "qa-flash", "verifier", "security", "security-senior",
      "documenter", "documenter-flash", "vision"
    ]
    for (const name of agentFiles) {
      writtenFiles[`${AGENTS_DIR}/devloom-${name}.md`] = `model: stale-paid-model\n`
    }
    const profile = await importProfile()
    const config = profile.cmdSet("go-flash")
    for (const name of agentFiles) {
      const content = writtenFiles[`${AGENTS_DIR}/devloom-${name}.md`]
      if (name === "vision") {
        expect(content).toContain("model: opencode-go/minimax-m3")
      } else {
        expect(content).toContain("model: opencode-go/deepseek-v4-flash")
      }
    }
  })

  test("applyModelsToAgentFiles stamps profile label into orchestrator description", async () => {
    const orchestratorPath = `${AGENTS_DIR}/devloom-orchestrator.md`
    writtenFiles[orchestratorPath] = 'description: "DevLoom Orchestrator: autonomous multi-agent delivery"\nmodel: old-model\n'
    const profile = await importProfile()
    profile.applyModelsToAgentFiles({ orchestrator: "opencode-go/deepseek-v4-flash" }, "go-flash")
    const content = writtenFiles[orchestratorPath]
    expect(content).toContain('description: "DevLoom Orchestrator: autonomous multi-agent delivery (profile: go-flash)"')
    expect(content).toContain("model: opencode-go/deepseek-v4-flash")
  })

  test("applyModelsToAgentFiles profile label is idempotent", async () => {
    const orchestratorPath = `${AGENTS_DIR}/devloom-orchestrator.md`
    writtenFiles[orchestratorPath] = 'description: "DevLoom Orchestrator: autonomous multi-agent delivery (profile: go-flash)"\nmodel: x\n'
    const profile = await importProfile()
    profile.applyModelsToAgentFiles({ orchestrator: "opencode-go/deepseek-v4-flash" }, "go-flash")
    const content = writtenFiles[orchestratorPath]
    expect(content.match(/\(profile: go-flash\)/g)).toHaveLength(1)
  })

  test("applyModelsToAgentFiles leaves subagent descriptions untouched", async () => {
    const developerPath = `${AGENTS_DIR}/devloom-developer.md`
    writtenFiles[developerPath] = 'description: "DevLoom Developer: callable by the orchestrator"\nmodel: old\n'
    const profile = await importProfile()
    profile.applyModelsToAgentFiles({ developer: "opencode-go/deepseek-v4-flash" }, "go-flash")
    expect(writtenFiles[developerPath]).toContain('description: "DevLoom Developer: callable by the orchestrator"')
    expect(writtenFiles[developerPath]).not.toContain("(profile:")
  })

  test("applyModelsToAgentFiles does not stamp a tier marker", async () => {
    const orchestratorPath = `${AGENTS_DIR}/devloom-orchestrator.md`
    writtenFiles[orchestratorPath] = 'description: "DevLoom Orchestrator: autonomous multi-agent delivery"\nmodel: old\n'
    const profile = await importProfile()
    profile.applyModelsToAgentFiles({ orchestrator: "opencode-go/kimi-k3" }, "go")
    const content = writtenFiles[orchestratorPath]
    expect(content).toContain("(profile: go)")
    expect(content).not.toContain("tier:")
  })

  test("cmdSet('go-flash') stamps profile into orchestrator agent description", async () => {
    const orchestratorPath = `${AGENTS_DIR}/devloom-orchestrator.md`
    writtenFiles[orchestratorPath] = 'description: "DevLoom Orchestrator: autonomous multi-agent delivery"\nmodel: stale\n'
    const profile = await importProfile()
    profile.cmdSet("go-flash")
    expect(writtenFiles[orchestratorPath]).toContain("(profile: go-flash)")
  })

  test("cmdSet refreshes cached agent files and prints restart guidance when cache is fresh", async () => {
    const orchestratorPath = `${AGENTS_DIR}/devloom-orchestrator.md`
    writtenFiles[orchestratorPath] = 'description: "DevLoom Orchestrator: autonomous multi-agent delivery"\nmodel: stale\n'
    mockDirs[AGENTS_DIR] = ["devloom-orchestrator.md"]
    const cachePackages = `${HOME}/.cache/opencode/packages`
    const cachePluginJs = `${cachePackages}/devloom/node_modules/devloom/dist/plugin.js`
    const cacheAgentsJs = `${cachePackages}/devloom/node_modules/devloom/dist/agents.js`
    const cacheOrchMd = `${cachePackages}/devloom/node_modules/devloom/agents/devloom-orchestrator.md`
    mockDirs[cachePackages] = ["devloom"]
    mockDirs[`${cachePackages}/devloom/node_modules/devloom`] = []
    writtenFiles[cachePluginJs] = "export const hook = 'injectDevloomAgents'"
    // Feature marker (profile-filter wiring) — a cache is only "fresh" with it.
    writtenFiles[cacheAgentsJs] = "export function agentVariantVisible(profile, variant) { return true }"

    const profile = await importProfile()
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    profile.cmdSet("go-flash")
    // Cached agent files were refreshed with the freshly stamped orchestrator.
    expect(writtenFiles[cacheOrchMd]).toContain("(profile: go-flash)")
    // Restart guidance appears unconditionally after a profile change.
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("OpenCode plugin cache refreshed with the current profile."))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Restart opencode (or run: opencode --continue) to see the updated profile and agents in the sidebar."))
    logSpy.mockRestore()
  })

  test("cmdApply prints stale plugin cache guidance when cached plugin lacks the config hook", async () => {
    const orchestratorPath = `${AGENTS_DIR}/devloom-orchestrator.md`
    writtenFiles[orchestratorPath] = 'description: "DevLoom Orchestrator: autonomous multi-agent delivery"\nmodel: stale\n'
    writtenFiles[CONFIG_PATH] = JSON.stringify({
      profile: "go-flash",
      resolvedProfile: "go-flash",
      models: { orchestrator: "opencode-go/deepseek-v4-flash" },
    })
    const cachePackages = `${HOME}/.cache/opencode/packages`
    const cachePluginJs = `${cachePackages}/devloom/node_modules/devloom/dist/plugin.js`
    mockDirs[cachePackages] = ["devloom"]
    mockDirs[`${cachePackages}/devloom/node_modules/devloom`] = []
    writtenFiles[cachePluginJs] = "// stale v1.0.0 plugin without the config hook"

    const profile = await importProfile()
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    profile.cmdApply()
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("plugin cache is stale"))
    expect(writtenFiles[orchestratorPath]).toContain("(profile: go-flash)")
    logSpy.mockRestore()
  })

  test("cmdApply refreshes cached agent files when plugin cache is fresh", async () => {
    const orchestratorPath = `${AGENTS_DIR}/devloom-orchestrator.md`
    writtenFiles[orchestratorPath] = 'description: "DevLoom Orchestrator: autonomous multi-agent delivery"\nmodel: stale\n'
    writtenFiles[CONFIG_PATH] = JSON.stringify({
      profile: "go-flash",
      resolvedProfile: "go-flash",
      models: { orchestrator: "opencode-go/deepseek-v4-flash" },
    })
    const cachePackages = `${HOME}/.cache/opencode/packages`
    const cachePluginJs = `${cachePackages}/devloom/node_modules/devloom/dist/plugin.js`
    const cacheAgentsJs = `${cachePackages}/devloom/node_modules/devloom/dist/agents.js`
    mockDirs[cachePackages] = ["devloom"]
    mockDirs[`${cachePackages}/devloom/node_modules/devloom`] = []
    writtenFiles[cachePluginJs] = "export const hook = 'injectDevloomAgents'"
    writtenFiles[cacheAgentsJs] = "export function agentVariantVisible(profile, variant) { return true }"

    const profile = await importProfile()
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    profile.cmdApply()
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining("plugin cache is stale"))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("updated profile and agents in the sidebar"))
    logSpy.mockRestore()
  })
})
