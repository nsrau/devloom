import { jest, describe, expect, test, beforeEach, afterEach } from "@jest/globals"
import { createLifecycleHooks } from "../src/plugin.js"

describe("createLifecycleHooks", () => {
  beforeEach(() => {
    delete process.env.DEVLOOM_DEBUG
  })

  afterEach(() => {
    delete process.env.DEVLOOM_DEBUG
  })

  test("returns hooks object with expected keys", () => {
    const hooks = createLifecycleHooks({} as any)
    expect(hooks).toHaveProperty("event")
    expect(hooks).toHaveProperty(["tool.execute.before"])
    expect(hooks).toHaveProperty(["tool.execute.after"])
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
