import { jest, describe, expect, test } from "@jest/globals"
import DevLoomPlugin from "../src/index.js"

describe("DevLoomPlugin", () => {
  test("is a function", () => {
    expect(typeof DevLoomPlugin).toBe("function")
  })

  test("returns hooks object when called with context", async () => {
    const hooks = await DevLoomPlugin({} as any)
    expect(hooks).toHaveProperty("event")
    expect(hooks).toHaveProperty(["tool.execute.before"])
    expect(hooks).toHaveProperty(["tool.execute.after"])
  })
})
