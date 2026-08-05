import { jest, describe, expect, test, beforeEach, afterEach } from "@jest/globals"
import {
  mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync,
  chmodSync, mkdirSync, accessSync, constants,
} from "fs"
import { join } from "path"
import { tmpdir } from "os"

jest.spyOn(process, "exit").mockImplementation(() => undefined as unknown as never)
jest.spyOn(console, "log").mockImplementation(() => {})
jest.spyOn(console, "error").mockImplementation(() => {})

const { getConfigDir, isPathSafe, ensureDir, installFile, isDebug, ensureTuiPlugin } = await import("../postinstall.mjs")

describe("getConfigDir", () => {
  beforeEach(() => {
    delete process.env.XDG_CONFIG_HOME
    delete process.env.APPDATA
  })

  test("returns Linux path by default", () => {
    const dir = getConfigDir("linux", "/home/user")
    expect(dir).toBe("/home/user/.config/opencode")
  })

  test("uses XDG_CONFIG_HOME on Linux when set", () => {
    process.env.XDG_CONFIG_HOME = "/custom/config"
    const dir = getConfigDir("linux", "/home/user")
    expect(dir).toBe("/custom/config/opencode")
  })

  test("returns macOS path", () => {
    const dir = getConfigDir("darwin", "/Users/user")
    expect(dir).toBe("/Users/user/Library/Application Support/opencode")
  })

  if (process.platform === "win32") {
    test("returns Windows path with APPDATA", () => {
      process.env.APPDATA = "C:\\Users\\user\\AppData\\Roaming"
      const dir = getConfigDir("win32", "C:\\Users\\user")
      expect(dir).toBe("C:\\Users\\user\\AppData\\Roaming\\opencode")
    })

    test("falls back to homedir on Windows when APPDATA is missing", () => {
      const dir = getConfigDir("win32", "C:\\Users\\user")
      expect(dir).toBe("C:\\Users\\user\\opencode")
    })
  }
})

describe("isPathSafe", () => {
  test("returns true for paths within base", () => {
    expect(isPathSafe("/base", "/base/agents/file.md")).toBe(true)
  })

  test("returns false for path traversal with ..", () => {
    expect(isPathSafe("/base", "/base/../../etc/passwd")).toBe(false)
  })

  test("returns false for absolute path escape", () => {
    expect(isPathSafe("/base", "/etc/passwd")).toBe(false)
  })

  test("returns true for nested subdirectory", () => {
    expect(isPathSafe("/base", "/base/sub/deep/file.md")).toBe(true)
  })
})

describe("ensureDir", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "devloom-test-"))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  test("creates directory if it does not exist", () => {
    const newDir = join(tmpDir, "new-subdir")
    expect(existsSync(newDir)).toBe(false)
    ensureDir(newDir)
    expect(existsSync(newDir)).toBe(true)
  })

  test("does nothing if directory exists", () => {
    mkdirSync(join(tmpDir, "existing"))
    expect(existsSync(join(tmpDir, "existing"))).toBe(true)
    expect(() => ensureDir(join(tmpDir, "existing"))).not.toThrow()
  })
})

describe("installFile", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "devloom-test-"))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  test("copies file when source exists and path is safe", () => {
    const src = join(tmpDir, "source.md")
    const dest = join(tmpDir, "dest.md")
    writeFileSync(src, "test content")
    installFile(src, dest, "Test file", tmpDir)
    expect(readFileSync(dest, "utf-8")).toBe("test content")
  })

  test("reports error when source file is missing", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    installFile("/nonexistent/source.md", join(tmpDir, "dest.md"), "Missing file", tmpDir)
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("not found"))
    errorSpy.mockRestore()
  })

  test("skips a missing optional source without failing the install", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    installFile("/nonexistent/theme.json", join(tmpDir, "dest.json"), "Optional", tmpDir, true)
    expect(errorSpy).not.toHaveBeenCalled()
    expect(existsSync(join(tmpDir, "dest.json"))).toBe(false)
    errorSpy.mockRestore()
  })

  test("blocks path traversal", () => {
    const src = join(tmpDir, "source.md")
    writeFileSync(src, "test")
    const configDir = join(tmpDir, "base")
    mkdirSync(configDir)
    const dest = join(tmpDir, "outside", "file.md")
    mkdirSync(join(tmpDir, "outside"))
    installFile(src, dest, "Traversal", configDir)
    expect(existsSync(dest)).toBe(false)
  })

  test("reports error on no write permission", () => {
    const src = join(tmpDir, "source.md")
    writeFileSync(src, "test")
    const destDir = join(tmpDir, "readonly")
    mkdirSync(destDir)

    let canWrite = true
    try {
      accessSync(destDir, constants.W_OK)
    } catch {
      canWrite = false
    }

    chmodSync(destDir, 0o444)

    let isReadOnly = true
    try {
      accessSync(destDir, constants.W_OK)
    } catch {
      isReadOnly = false
    }
    isReadOnly = !isReadOnly

    if (!isReadOnly) {
      chmodSync(destDir, 0o755)
      return
    }

    const dest = join(destDir, "file.md")
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    installFile(src, dest, "No perm", tmpDir)
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("No write permission"))
    errorSpy.mockRestore()
    chmodSync(destDir, 0o755)
  })
})

describe("ensureTuiPlugin", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "devloom-tui-"))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  test("creates tui.json with the devloom TUI plugin when the file is missing", () => {
    const tuiPath = join(tmpDir, "tui.json")
    const tui = ensureTuiPlugin(tuiPath) as unknown as Record<string, unknown>
    expect(tui.plugin).toEqual(["devloom"])
    expect(JSON.parse(readFileSync(tuiPath, "utf8")).plugin).toEqual(["devloom"])
    expect(JSON.parse(readFileSync(tuiPath, "utf8")).$schema).toContain("opencode.ai/tui.json")
  })

  test("preserves the theme and existing keys while adding the plugin", () => {
    const tuiPath = join(tmpDir, "tui.json")
    writeFileSync(tuiPath, JSON.stringify({ $schema: "https://opencode.ai/tui.json", theme: "custom-theme" }))
    const tui = ensureTuiPlugin(tuiPath) as unknown as Record<string, unknown>
    expect(tui.theme).toBe("custom-theme")
    expect(tui.plugin).toEqual(["devloom"])
    const onDisk = JSON.parse(readFileSync(tuiPath, "utf8"))
    expect(onDisk.theme).toBe("custom-theme")
    expect(onDisk.plugin).toEqual(["devloom"])
  })

  test("dedupes an existing devloom plugin entry", () => {
    const tuiPath = join(tmpDir, "tui.json")
    writeFileSync(tuiPath, JSON.stringify({ plugin: ["devloom", "other"] }))
    const tui = ensureTuiPlugin(tuiPath) as unknown as Record<string, unknown>
    expect(tui.plugin).toEqual(["other", "devloom"])
  })

  test("returns null on a corrupt tui.json without overwriting it", () => {
    const tuiPath = join(tmpDir, "tui.json")
    writeFileSync(tuiPath, "{ not json")
    expect(ensureTuiPlugin(tuiPath)).toBeNull()
    expect(readFileSync(tuiPath, "utf8")).toBe("{ not json")
  })
})

describe("isDebug", () => {
  beforeEach(() => {
    delete process.env.DEVLOOM_DEBUG
  })

  test("returns false when DEVLOOM_DEBUG is not set", () => {
    expect(isDebug()).toBe(false)
  })

  test("returns true when DEVLOOM_DEBUG=1", () => {
    process.env.DEVLOOM_DEBUG = "1"
    expect(isDebug()).toBe(true)
  })

  test("returns true when DEVLOOM_DEBUG=true", () => {
    process.env.DEVLOOM_DEBUG = "true"
    expect(isDebug()).toBe(true)
  })
})
