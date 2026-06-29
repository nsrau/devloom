import { jest, describe, expect, test, beforeEach, afterEach } from "@jest/globals"
import { homedir } from "os"

const HOME = homedir()
const AGENTS_DIR = `${HOME}/.config/opencode/agents`
const CONFIG_PATH = ".opencode/devloom/config.json"

const ALL_GO_MODELS = [
  "opencode-go/glm-5.1",
  "opencode-go/kimi-k2.6",
  "opencode-go/deepseek-v4-pro",
  "opencode-go/deepseek-v4-flash",
  "opencode-go/qwen3.6-plus",
  "opencode-go/minimax-m3",
]

const ALL_FREE_MODELS = [
  "opencode/nemotron-3-ultra-free",
  "opencode/mimo-v2.5-free",
  "opencode/deepseek-v4-flash-free",
  "opencode/big-pickle",
]

const ALL_MODELS = [...ALL_GO_MODELS, ...ALL_FREE_MODELS]

let mockAvailable: string[] = []
let writtenFiles: Record<string, string> = {}
let mockExitError: Error | null = null

jest.unstable_mockModule("child_process", () => ({
  execSync: (cmd: string) => {
    if (cmd.startsWith("opencode models")) return mockAvailable.join("\n")
    if (cmd.startsWith("chmod")) return ""
    return ""
  },
}))

jest.unstable_mockModule("fs", () => ({
  readFileSync: (p: string, enc?: string) => {
    if (writtenFiles[p] !== undefined) return writtenFiles[p]
    throw new Error("ENOENT")
  },
  writeFileSync: (p: string, c: string) => {
    writtenFiles[p] = c
  },
  existsSync: (p: string) => p in writtenFiles,
  mkdirSync: () => {},
  readdirSync: () => [],
  cpSync: () => {},
}))

jest.unstable_mockModule("os", () => ({
  homedir: () => HOME,
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
    for (const [role, model] of Object.entries(config.models) as [string, string][]) {
      if (role === "vision") {
        // ponytail: no free vision models exist; free profile falls back to cheapest multimodal
        expect(model).toMatch(/^opencode(-go)?\//);
      } else {
        expect(model).toMatch(/^(opencode\/.*-free|opencode\/big-pickle)$/)
      }
    }
  })

  test("cmdSet('go') assigns correct go models without fallback", async () => {
    const profile = await importProfile()
    const config = profile.cmdSet("go")
    expect(config.models.orchestrator).toBe("opencode-go/glm-5.1")
    expect(config.models.developer).toBe("opencode-go/kimi-k2.6")
    expect(config.models.qa).toBe("opencode-go/deepseek-v4-pro")
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
    profile.applyModelsToAgentFiles({ orchestrator: "opencode-go/glm-5.1" })
    const content = writtenFiles[agentPath]
    expect(content).toContain("model: opencode-go/glm-5.1")
    expect(content).toContain("# Orchestrator")
    expect(content).not.toContain("model: old-model")
  })

  test("cmdSet('go') falls back developer when go model is missing", async () => {
    mockAvailable = ALL_MODELS.filter((m) => m !== "opencode-go/kimi-k2.6")
    const profile = await importProfile()
    const config = profile.cmdSet("go")
    expect(config.models.developer).toMatch(/^(opencode\/.*-free|opencode\/big-pickle)$/)
    expect(config.fallbacks).toHaveProperty("developer")
    expect(config.fallbacks.developer.from).toBe("opencode-go/kimi-k2.6")
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
})
