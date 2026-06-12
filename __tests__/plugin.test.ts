import { jest, describe, expect, test, beforeEach, afterEach } from "@jest/globals"
import { existsSync, mkdtempSync, mkdirSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { createLifecycleHooks } from "../src/plugin.js"

describe("createLifecycleHooks", () => {
  beforeEach(() => {
    delete process.env.DEVLOOM_DEBUG
  })

  afterEach(() => {
    delete process.env.DEVLOOM_DEBUG
  })

  test("does not create workspace in projects without .opencode/devloom", () => {
    const dir = mkdtempSync(join(tmpdir(), "devloom-plugin-"))
    try {
      createLifecycleHooks({ directory: dir } as any)
      expect(existsSync(join(dir, ".opencode"))).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("normalizes workspace when .opencode/devloom exists", () => {
    const dir = mkdtempSync(join(tmpdir(), "devloom-plugin-"))
    try {
      mkdirSync(join(dir, ".opencode", "devloom"), { recursive: true })
      createLifecycleHooks({ directory: dir } as any)
      expect(existsSync(join(dir, ".opencode", "devloom", "project", "state.json"))).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("returns hooks object with expected keys", () => {
    const hooks = createLifecycleHooks({} as any)
    expect(hooks).toHaveProperty("event")
    expect(hooks).toHaveProperty(["chat.message"])
    expect(hooks).toHaveProperty(["experimental.chat.system.transform"])
    expect(hooks).toHaveProperty(["experimental.session.compacting"])
    expect(hooks).toHaveProperty(["tool.execute.before"])
    expect(hooks).toHaveProperty(["tool.execute.after"])
  })

  test("chat.message appends synthetic guard part for main agent", async () => {
    const hooks = createLifecycleHooks({} as any)
    const output = { message: { id: "msg-1", sessionID: "sess-1" }, parts: [] as any[] }
    await hooks["chat.message"]!({ sessionID: "sess-1", agent: "build" } as any, output as any)
    expect(output.parts).toHaveLength(1)
    expect(output.parts[0].type).toBe("text")
    expect(output.parts[0].synthetic).toBe(true)
    expect(output.parts[0].text).toContain("devloom-orchestrator")
  })

  test("chat.message does not inject for devloom worker agents", async () => {
    const hooks = createLifecycleHooks({} as any)
    const output = { message: { id: "msg-1", sessionID: "sess-2" }, parts: [] as any[] }
    await hooks["chat.message"]!({ sessionID: "sess-2", agent: "devloom-developer" } as any, output as any)
    expect(output.parts).toHaveLength(0)
  })

  test("system transform injects guard for tracked session", async () => {
    const hooks = createLifecycleHooks({} as any)
    const msgOutput = { message: { id: "m", sessionID: "sess-3" }, parts: [] as any[] }
    await hooks["chat.message"]!({ sessionID: "sess-3", agent: "devloom-orchestrator" } as any, msgOutput as any)
    const sysOutput = { system: [] as string[] }
    await hooks["experimental.chat.system.transform"]!({ sessionID: "sess-3", model: {} as any }, sysOutput)
    expect(sysOutput.system).toHaveLength(1)
    expect(sysOutput.system[0]).toContain("delegate ALL phase work via task()")
  })

  test("compaction hook injects preservation context", async () => {
    const hooks = createLifecycleHooks({} as any)
    const output = { context: [] as string[] }
    await hooks["experimental.session.compacting"]!({ sessionID: "sess-1" }, output as any)
    expect(output.context[0]).toContain("devloom-orchestrator")
    expect(output.context[0]).toContain("state.json")
  })

  test("blocks orchestrator file writes outside devloom state dir", async () => {
    const hooks = createLifecycleHooks({} as any)
    const msgOutput = { message: { id: "m", sessionID: "sess-4" }, parts: [] as any[] }
    await hooks["chat.message"]!({ sessionID: "sess-4", agent: "devloom-orchestrator" } as any, msgOutput as any)
    await expect(
      hooks["tool.execute.before"]!(
        { tool: "write", sessionID: "sess-4", callID: "c1" },
        { args: { filePath: "src/app.ts" } }
      )
    ).rejects.toThrow("DevLoom guard")
  })

  test("allows orchestrator state writes and other agents' writes", async () => {
    const hooks = createLifecycleHooks({} as any)
    const msgOutput = { message: { id: "m", sessionID: "sess-5" }, parts: [] as any[] }
    await hooks["chat.message"]!({ sessionID: "sess-5", agent: "devloom-orchestrator" } as any, msgOutput as any)
    await expect(
      hooks["tool.execute.before"]!(
        { tool: "write", sessionID: "sess-5", callID: "c1" },
        { args: { filePath: ".opencode/devloom/project/state.json" } }
      )
    ).resolves.toBeUndefined()
    await expect(
      hooks["tool.execute.before"]!(
        { tool: "write", sessionID: "sess-other", callID: "c2" },
        { args: { filePath: "src/app.ts" } }
      )
    ).resolves.toBeUndefined()
  })

  test("does not log when DEVLOOM_DEBUG is not set", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    const hooks = createLifecycleHooks({} as any)
    hooks.event!({ event: { type: "test", properties: {} } } as any)
    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  test("logs event when DEVLOOM_DEBUG=1", () => {
    process.env.DEVLOOM_DEBUG = "1"
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    const hooks = createLifecycleHooks({} as any)
    hooks.event!({ event: { type: "session.start", properties: {} } } as any)
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[devloom]"),
      "Event received",
      expect.any(String)
    )
    consoleSpy.mockRestore()
  })

  test("logs tool.execute.before when DEVLOOM_DEBUG=1", () => {
    process.env.DEVLOOM_DEBUG = "1"
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    const hooks = createLifecycleHooks({} as any)
    hooks["tool.execute.before"]!({ tool: "read", sessionID: "sess-1" } as any, { args: [], metadata: {} })
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[devloom]"),
      "Tool executing",
      expect.any(String)
    )
    consoleSpy.mockRestore()
  })

  test("logs tool.execute.after when DEVLOOM_DEBUG=1", () => {
    process.env.DEVLOOM_DEBUG = "1"
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    const hooks = createLifecycleHooks({} as any)
    hooks["tool.execute.after"]!({ tool: "read", sessionID: "sess-1" } as any, { title: "test", output: "hello", metadata: {} })
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[devloom]"),
      "Tool completed",
      expect.any(String)
    )
    consoleSpy.mockRestore()
  })
})
