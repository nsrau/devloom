import { jest, describe, expect, test, beforeEach } from "@jest/globals"

const mockFs = {
  existsSync: jest.fn<() => boolean>(),
  mkdirSync: jest.fn(),
  copyFileSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  accessSync: jest.fn(),
  constants: { W_OK: 2, R_OK: 4, X_OK: 1, F_OK: 0 },
}

const mockOs = {
  homedir: jest.fn<() => string>(),
  platform: jest.fn<() => string>(),
}

jest.unstable_mockModule("fs", () => mockFs)
jest.unstable_mockModule("os", () => mockOs)

mockOs.platform.mockReturnValue("linux")
mockOs.homedir.mockReturnValue("/home/user")

jest.spyOn(process, "exit").mockImplementation(() => undefined as unknown as never)
jest.spyOn(console, "log").mockImplementation(() => {})
jest.spyOn(console, "error").mockImplementation(() => {})

const { getConfigDir, isPathSafe, ensureDir, installFile, isDebug } = await import("../postinstall.mjs")

describe("getConfigDir", () => {
  beforeEach(() => {
    delete process.env.XDG_CONFIG_HOME
    delete process.env.APPDATA
  })

  test("returns Linux path by default", () => {
    mockOs.platform.mockReturnValue("linux")
    mockOs.homedir.mockReturnValue("/home/user")
    const dir = getConfigDir()
    expect(dir).toBe("/home/user/.config/opencode")
  })

  test("uses XDG_CONFIG_HOME on Linux when set", () => {
    mockOs.platform.mockReturnValue("linux")
    mockOs.homedir.mockReturnValue("/home/user")
    process.env.XDG_CONFIG_HOME = "/custom/config"
    const dir = getConfigDir()
    expect(dir).toBe("/custom/config/opencode")
  })

  test("returns macOS path", () => {
    mockOs.platform.mockReturnValue("darwin")
    mockOs.homedir.mockReturnValue("/Users/user")
    const dir = getConfigDir()
    expect(dir).toBe("/Users/user/Library/Application Support/opencode")
  })

  if (process.platform === "win32") {
    test("returns Windows path", () => {
      mockOs.platform.mockReturnValue("win32")
      process.env.APPDATA = "C:\\Users\\user\\AppData\\Roaming"
      const dir = getConfigDir()
      expect(dir).toBe("C:\\Users\\user\\AppData\\Roaming\\opencode")
    })

    test("falls back to homedir on Windows when APPDATA is missing", () => {
      mockOs.platform.mockReturnValue("win32")
      delete process.env.APPDATA
      mockOs.homedir.mockReturnValue("C:\\Users\\user")
      const dir = getConfigDir()
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
  beforeEach(() => {
    mockFs.existsSync.mockReset()
    mockFs.mkdirSync.mockReset()
  })

  test("creates directory if it does not exist", () => {
    mockFs.existsSync.mockReturnValue(false)
    ensureDir("/some/dir")
    expect(mockFs.mkdirSync).toHaveBeenCalledWith("/some/dir", { recursive: true })
  })

  test("does nothing if directory exists", () => {
    mockFs.existsSync.mockReturnValue(true)
    ensureDir("/some/dir")
    expect(mockFs.mkdirSync).not.toHaveBeenCalled()
  })
})

describe("installFile", () => {
  const CONFIG_DIR = "/home/user/.config/opencode"

  beforeEach(() => {
    mockFs.existsSync.mockReset()
    mockFs.accessSync.mockReset()
    mockFs.copyFileSync.mockReset()
  })

  test("copies file when source exists and path is safe", () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.accessSync.mockReturnValue(undefined)
    const dest = `${CONFIG_DIR}/agents/file.md`
    installFile("/src/file.md", dest, "Test file")
    expect(mockFs.copyFileSync).toHaveBeenCalledWith("/src/file.md", dest)
  })

  test("reports error when source file is missing", () => {
    mockFs.existsSync.mockReturnValue(false)
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    installFile("/src/missing.md", `${CONFIG_DIR}/file.md`, "Missing file")
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("not found"))
    consoleSpy.mockRestore()
  })

  test("blocks path traversal", () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.accessSync.mockReturnValue(undefined)
    installFile("/src/file.md", "/dest/../../etc/passwd", "Traversal")
    expect(mockFs.copyFileSync).not.toHaveBeenCalled()
  })

  test("reports error on no write permission", () => {
    mockFs.existsSync.mockReturnValue(true)
    const accessErr = new Error("EACCES")
    ;(accessErr as NodeJS.ErrnoException).code = "EACCES"
    mockFs.accessSync.mockImplementation(() => { throw accessErr })
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    installFile("/src/file.md", `${CONFIG_DIR}/agents/file.md`, "No perm")
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("No write permission"))
    expect(mockFs.copyFileSync).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
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
