import { jest, describe, expect, test, beforeEach, afterEach } from "@jest/globals"
import {
  mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync,
} from "fs"
import { join } from "path"
import { tmpdir } from "os"

const {
  getOpenCodeCacheDir,
  openCodePluginEntries,
  refreshOpenCodePluginCache,
  refreshOpenCodePluginAgentFiles,
  syncOpenCodePluginDependencies,
  buildPackageDist,
  pluginCacheStatus,
  pluginCacheStatusDetail,
  runCli,
} = await import("../scripts/plugin-cache.mjs")

describe("getOpenCodeCacheDir", () => {
  beforeEach(() => {
    delete process.env.XDG_CACHE_HOME
    delete process.env.LOCALAPPDATA
  })

  test("returns Linux path by default", () => {
    const dir = getOpenCodeCacheDir("linux", "/home/user")
    expect(dir).toBe("/home/user/.cache/opencode")
  })

  test("uses XDG_CACHE_HOME on Linux when set", () => {
    process.env.XDG_CACHE_HOME = "/custom/cache"
    const dir = getOpenCodeCacheDir("linux", "/home/user")
    expect(dir).toBe("/custom/cache/opencode")
  })

  test("returns macOS path", () => {
    const dir = getOpenCodeCacheDir("darwin", "/Users/user")
    expect(dir).toBe("/Users/user/Library/Caches/opencode")
  })

  test("returns Windows path with LOCALAPPDATA", () => {
    if (process.platform !== "win32") return
    process.env.LOCALAPPDATA = "C:\\Users\\user\\AppData\\Local"
    const dir = getOpenCodeCacheDir("win32", "C:\\Users\\user")
    expect(dir).toBe("C:\\Users\\user\\AppData\\Local\\cache\\opencode")
  })

  test("falls back to homedir on Windows when LOCALAPPDATA is missing", () => {
    if (process.platform !== "win32") return
    const dir = getOpenCodeCacheDir("win32", "C:\\Users\\user")
    expect(dir).toBe("C:\\Users\\user\\cache\\opencode")
  })
})

function makeSourcePackage() {
  const source = mkdtempSync(join(tmpdir(), "devloom-src-"))
  writeFileSync(
    join(source, "package.json"),
    JSON.stringify({ name: "devloom", version: "1.0.1", files: ["dist", "agents"] })
  )
  mkdirSync(join(source, "dist"), { recursive: true })
  writeFileSync(join(source, "dist", "plugin.js"), "export const hook = 'injectDevloomAgents'")
  // Feature marker the status check uses to distinguish freshly built dist
  // (profile-filter wiring) from older builds that only carry the hook.
  writeFileSync(join(source, "dist", "agents.js"), "export function agentVariantVisible(profile, variant) { return true }")
  mkdirSync(join(source, "agents"), { recursive: true })
  writeFileSync(join(source, "agents", "devloom-orchestrator.md"), "# Orchestrator\n")
  return source
}

function makeCacheWithEntry(entryName: string, cache: string) {
  const entry = join(cache, "packages", entryName, "node_modules", "devloom")
  mkdirSync(join(entry, "dist"), { recursive: true })
  writeFileSync(join(entry, "dist", "plugin.js"), "// stale v1.0.0 without config hook")
  return entry
}

describe("openCodePluginEntries", () => {
  let cache: string
  beforeEach(() => {
    cache = mkdtempSync(join(tmpdir(), "devloom-cache-"))
  })
  afterEach(() => {
    rmSync(cache, { recursive: true, force: true })
  })

  test("returns empty when cache dir has no packages", () => {
    expect(openCodePluginEntries(cache)).toEqual([])
  })

  test("finds devloom and devloom@latest cache entries", () => {
    makeCacheWithEntry("devloom", cache)
    makeCacheWithEntry("devloom@latest", cache)
    const entries = openCodePluginEntries(cache)
    expect(entries).toContain("devloom")
    expect(entries).toContain("devloom@latest")
  })

  test("ignores cache entries without a devloom package", () => {
    mkdirSync(join(cache, "packages", "other-plugin", "node_modules"), { recursive: true })
    expect(openCodePluginEntries(cache)).toEqual([])
  })
})

describe("refreshOpenCodePluginCache", () => {
  let source: string
  let cache: string
  beforeEach(() => {
    source = makeSourcePackage()
    cache = mkdtempSync(join(tmpdir(), "devloom-cache-"))
  })
  afterEach(() => {
    rmSync(source, { recursive: true, force: true })
    rmSync(cache, { recursive: true, force: true })
  })

  test("copies package files into existing devloom cache entry", () => {
    const entry = makeCacheWithEntry("devloom", cache)
    const result = refreshOpenCodePluginCache(source, cache)
    expect(result.errors).toEqual([])
    expect(result.refreshed).toContain("devloom")
    expect(readFileSync(join(entry, "dist", "plugin.js"), "utf8")).toContain("injectDevloomAgents")
    expect(readFileSync(join(entry, "agents", "devloom-orchestrator.md"), "utf8")).toContain("# Orchestrator")
    expect(JSON.parse(readFileSync(join(entry, "package.json"), "utf8")).version).toBe("1.0.1")
  })

  test("refreshes both devloom and devloom@latest entries", () => {
    makeCacheWithEntry("devloom", cache)
    makeCacheWithEntry("devloom@latest", cache)
    const result = refreshOpenCodePluginCache(source, cache)
    expect(result.refreshed.sort()).toEqual(["devloom", "devloom@latest"])
    expect(
      readFileSync(
        join(cache, "packages", "devloom@latest", "node_modules", "devloom", "dist", "plugin.js"),
        "utf8"
      )
    ).toContain("injectDevloomAgents")
  })

  test("skips cleanly when no cache entries exist", () => {
    const result = refreshOpenCodePluginCache(source, cache)
    expect(result.refreshed).toEqual([])
    expect(result.skipped.length).toBeGreaterThan(0)
    expect(result.errors).toEqual([])
  })

  test("reports an error instead of throwing when source package.json is missing", () => {
    const empty = mkdtempSync(join(tmpdir(), "devloom-empty-"))
    const result = refreshOpenCodePluginCache(empty, cache)
    expect(result.errors.length).toBeGreaterThan(0)
    rmSync(empty, { recursive: true, force: true })
  })

  test("does not create cache entries that were not already installed", () => {
    refreshOpenCodePluginCache(source, cache)
    expect(existsSync(join(cache, "packages", "devloom"))).toBe(false)
  })

  test("rebuilds dist before copying when package.json declares a build script", () => {
    writeFileSync(
      join(source, "package.json"),
      JSON.stringify({ name: "devloom", version: "1.0.1", files: ["dist", "agents"], scripts: { build: "tsc" } })
    )
    writeFileSync(join(source, "dist", "plugin.js"), "// stale code, the fake build rewrites it")
    const entry = makeCacheWithEntry("devloom", cache)
    const exec = (cmd: string, args: string[]) => {
      if (cmd === "npm" && args[0] === "run") {
        writeFileSync(join(source, "dist", "plugin.js"), "export const hook = 'injectDevloomAgents'")
      }
      return ""
    }
    const result = refreshOpenCodePluginCache(source, cache, exec as never) as unknown as {
      refreshed: string[]
      errors: string[]
      build: { built: boolean }
    }
    expect(result.build.built).toBe(true)
    expect(result.errors).toEqual([])
    expect(readFileSync(join(entry, "dist", "plugin.js"), "utf8")).toContain("injectDevloomAgents")
  })
})

describe("buildPackageDist", () => {
  let source: string
  let cache: string
  beforeEach(() => {
    source = makeSourcePackage()
    cache = mkdtempSync(join(tmpdir(), "devloom-cache-"))
  })
  afterEach(() => {
    rmSync(source, { recursive: true, force: true })
    rmSync(cache, { recursive: true, force: true })
  })

  test("runs the declared build script via npm run build", () => {
    writeFileSync(
      join(source, "package.json"),
      JSON.stringify({ name: "devloom", scripts: { build: "tsc" } })
    )
    const calls: Array<{ cmd: string; args: string[]; opts: { cwd: string } }> = []
    const exec = (cmd: string, args: string[], opts?: { cwd: string }) => {
      calls.push({ cmd, args, opts: opts ?? { cwd: "" } })
      return ""
    }
    const result = buildPackageDist(source, exec as never)
    expect(result.built).toBe(true)
    expect(result.errors).toEqual([])
    expect(calls).toHaveLength(1)
    expect(calls[0].cmd).toBe("npm")
    expect(calls[0].args).toEqual(["run", "build"])
    expect(calls[0].opts.cwd).toBe(source)
  })

  test("skips cleanly when package.json has no build script", () => {
    const exec = () => {
      throw new Error("should not run")
    }
    const result = buildPackageDist(source, exec as never)
    expect(result.built).toBe(false)
    expect(result.errors).toEqual([])
    expect(result.skipped).toBeTruthy()
  })

  test("tolerates a failing build and reports the error", () => {
    writeFileSync(
      join(source, "package.json"),
      JSON.stringify({ name: "devloom", scripts: { build: "tsc" } })
    )
    const exec = () => {
      throw new Error("tsc boom")
    }
    const result = buildPackageDist(source, exec as never)
    expect(result.built).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain("tsc boom")
  })
})

describe("pluginCacheStatus", () => {
  let source: string
  let cache: string
  beforeEach(() => {
    source = makeSourcePackage()
    cache = mkdtempSync(join(tmpdir(), "devloom-cache-"))
  })
  afterEach(() => {
    rmSync(source, { recursive: true, force: true })
    rmSync(cache, { recursive: true, force: true })
  })

  test("reports missing when the plugin was never installed in OpenCode", () => {
    expect(pluginCacheStatus(cache)).toBe("missing")
  })

  test("reports stale when cached plugin code lacks the config hook", () => {
    makeCacheWithEntry("devloom", cache)
    expect(pluginCacheStatus(cache)).toBe("stale")
  })

  test("reports ok when cached plugin code has injectDevloomAgents", () => {
    makeCacheWithEntry("devloom", cache)
    refreshOpenCodePluginCache(source, cache)
    expect(pluginCacheStatus(cache)).toBe("ok")
  })

  test("reports stale when cached dist/agents.js lacks the feature marker", () => {
    makeCacheWithEntry("devloom", cache)
    refreshOpenCodePluginCache(source, cache)
    // Old build: has the config hook but none of the profile-filter wiring.
    writeFileSync(
      join(cache, "packages", "devloom", "node_modules", "devloom", "dist", "agents.js"),
      "export function listDevloomAgents() { return [] }\n"
    )
    expect(pluginCacheStatus(cache)).toBe("stale")
  })

  test("reports stale when one of two entries lacks the config hook", () => {
    makeCacheWithEntry("devloom", cache)
    refreshOpenCodePluginCache(source, cache) // devloom is now fresh
    makeCacheWithEntry("devloom@latest", cache) // devloom@latest stays stale
    expect(pluginCacheStatus(cache)).toBe("stale")
  })

  test("reports ok only when every entry has the config hook", () => {
    makeCacheWithEntry("devloom", cache)
    makeCacheWithEntry("devloom@latest", cache)
    refreshOpenCodePluginCache(source, cache)
    expect(pluginCacheStatus(cache)).toBe("ok")
  })
})

describe("pluginCacheStatusDetail", () => {
  let source: string
  let cache: string
  beforeEach(() => {
    source = makeSourcePackage()
    cache = mkdtempSync(join(tmpdir(), "devloom-cache-"))
  })
  afterEach(() => {
    rmSync(source, { recursive: true, force: true })
    rmSync(cache, { recursive: true, force: true })
  })

  test("reports missing with no entries", () => {
    const detail = pluginCacheStatusDetail(cache)
    expect(detail.status).toBe("missing")
    expect(detail.entries).toEqual([])
  })

  test("breaks down hook and orchestrator profile label per entry", () => {
    makeCacheWithEntry("devloom", cache)
    const detail = pluginCacheStatusDetail(cache)
    expect(detail.status).toBe("stale")
    expect(detail.entries).toHaveLength(1)
    expect(detail.entries[0].entry).toBe("devloom")
    expect(detail.entries[0].hook).toBe(false)
    expect(detail.entries[0].featureCode).toBe(false)
    expect(detail.entries[0].orchestratorLabel).toBe(false)
  })

  test("detects the feature code marker in a fresh entry", () => {
    makeCacheWithEntry("devloom", cache)
    refreshOpenCodePluginCache(source, cache)
    const detail = pluginCacheStatusDetail(cache)
    expect(detail.status).toBe("ok")
    expect(detail.entries[0].hook).toBe(true)
    expect(detail.entries[0].featureCode).toBe(true)
  })

  test("detects orchestrator profile label in a fresh entry", () => {
    makeCacheWithEntry("devloom", cache)
    refreshOpenCodePluginCache(source, cache)
    // Stamp the profile label into the cached orchestrator agent file, as
    // `refreshOpenCodePluginAgentFiles` does after a profile change.
    const orchMd = join(cache, "packages", "devloom", "node_modules", "devloom", "agents", "devloom-orchestrator.md")
    writeFileSync(orchMd, 'description: "DevLoom Orchestrator: autonomous multi-agent delivery (profile: go-flash)"\n')
    const detail = pluginCacheStatusDetail(cache)
    expect(detail.status).toBe("ok")
    expect(detail.entries[0].hook).toBe(true)
    expect(detail.entries[0].featureCode).toBe(true)
    expect(detail.entries[0].orchestratorLabel).toBe(true)
  })

  test("orchestratorLabel matches the extended label with a tier marker", () => {
    makeCacheWithEntry("devloom", cache)
    refreshOpenCodePluginCache(source, cache)
    const orchMd = join(cache, "packages", "devloom", "node_modules", "devloom", "agents", "devloom-orchestrator.md")
    writeFileSync(orchMd, 'description: "DevLoom Orchestrator: autonomous multi-agent delivery (profile: go, tier: senior)"\n')
    const detail = pluginCacheStatusDetail(cache)
    expect(detail.status).toBe("ok")
    expect(detail.entries[0].orchestratorLabel).toBe(true)
  })
})

describe("runCli", () => {
  let source: string
  let cache: string
  beforeEach(() => {
    source = makeSourcePackage()
    cache = mkdtempSync(join(tmpdir(), "devloom-cache-"))
  })
  afterEach(() => {
    rmSync(source, { recursive: true, force: true })
    rmSync(cache, { recursive: true, force: true })
  })

  test("status returns missing and prints guidance when plugin never installed", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    const result = runCli(["status"], cache)
    expect(result).toBe("missing")
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("missing"))
    logSpy.mockRestore()
  })

  test("status returns stale with per-entry hook info", () => {
    makeCacheWithEntry("devloom", cache)
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    const result = runCli(["status"], cache)
    expect(result).toBe("stale")
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("devloom"))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("hook=NO"))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("feature-code=NO"))
    logSpy.mockRestore()
  })

  test("status returns ok after a full refresh", () => {
    makeCacheWithEntry("devloom", cache)
    refreshOpenCodePluginCache(source, cache)
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    const result = runCli(["status"], cache)
    expect(result).toBe("ok")
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("hook=yes"))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("feature-code=yes"))
    logSpy.mockRestore()
  })

  test("unknown command prints usage", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    const result = runCli(["bogus"], cache)
    expect(result).toBeNull()
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("status"))
    logSpy.mockRestore()
  })
})

describe("syncOpenCodePluginDependencies", () => {
  let source: string
  let cache: string
  beforeEach(() => {
    source = makeSourcePackage()
    cache = mkdtempSync(join(tmpdir(), "devloom-cache-"))
  })
  afterEach(() => {
    rmSync(source, { recursive: true, force: true })
    rmSync(cache, { recursive: true, force: true })
  })

  test("runs npm install inside each cache entry plugin dir with safe flags", () => {
    makeCacheWithEntry("devloom", cache)
    const calls: Array<{ cmd: string; args: string[] }> = []
    const exec = (cmd: string, args: string[]) => {
      calls.push({ cmd, args })
      return ""
    }
    const result = syncOpenCodePluginDependencies(source, cache, exec as never)
    expect(result.synced).toContain("devloom")
    expect(calls).toHaveLength(1)
    expect(calls[0].cmd).toBe("npm")
    expect(calls[0].args).toEqual(
      expect.arrayContaining([
        "install",
        "--prefix",
        join(cache, "packages", "devloom", "node_modules", "devloom"),
        "--no-save",
        "--ignore-scripts",
        "--omit=dev",
      ])
    )
  })

  test("records an error when the npm install fails", () => {
    makeCacheWithEntry("devloom", cache)
    const exec = () => {
      throw new Error("npm boom")
    }
    const result = syncOpenCodePluginDependencies(source, cache, exec as never)
    expect(result.synced).toEqual([])
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain("npm boom")
  })

  test("skips cleanly when no cache entries exist", () => {
    const exec = () => {
      throw new Error("should not run")
    }
    const result = syncOpenCodePluginDependencies(source, cache, exec as never)
    expect(result.synced).toEqual([])
    expect(result.skipped.length).toBeGreaterThan(0)
    expect(result.errors).toEqual([])
  })
})

describe("refreshOpenCodePluginAgentFiles", () => {
  let agentsDir: string
  let cache: string
  beforeEach(() => {
    agentsDir = mkdtempSync(join(tmpdir(), "devloom-agents-src-"))
    writeFileSync(join(agentsDir, "devloom-orchestrator.md"), "# Orchestrator\n")
    writeFileSync(join(agentsDir, "not-devloom.md"), "irrelevant\n")
    cache = mkdtempSync(join(tmpdir(), "devloom-cache-"))
  })
  afterEach(() => {
    rmSync(agentsDir, { recursive: true, force: true })
    rmSync(cache, { recursive: true, force: true })
  })

  test("copies devloom agent files into the cached plugin package", () => {
    const entry = makeCacheWithEntry("devloom", cache)
    const result = refreshOpenCodePluginAgentFiles(agentsDir, cache)
    expect(result.refreshed).toContain("devloom")
    expect(readFileSync(join(entry, "agents", "devloom-orchestrator.md"), "utf8")).toContain("# Orchestrator")
    expect(existsSync(join(entry, "agents", "not-devloom.md"))).toBe(false)
  })

  test("skips when no cache entries exist", () => {
    const result = refreshOpenCodePluginAgentFiles(agentsDir, cache)
    expect(result.refreshed).toEqual([])
    expect(result.skipped.length).toBeGreaterThan(0)
  })
})
