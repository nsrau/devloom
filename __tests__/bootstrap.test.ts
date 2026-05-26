import { afterEach, describe, expect, test } from "@jest/globals"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { ensureProjectWorkspace } from "../src/bootstrap.js"

describe("ensureProjectWorkspace", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test("creates canonical workspace on first use", () => {
    const root = mkdtempSync(join(tmpdir(), "devloom-bootstrap-"))
    tempDirs.push(root)

    const result = ensureProjectWorkspace(root)

    expect(existsSync(join(root, ".opencode", "devloom", "project", "config.json"))).toBe(true)
    expect(result.config.lang).toBe("en")
    expect(result.board.cols.doing).toEqual([])
    expect(result.state.next).toBe("analysis")
  })

  test("normalizes legacy project files in place", () => {
    const root = mkdtempSync(join(tmpdir(), "devloom-bootstrap-"))
    tempDirs.push(root)
    const projectRoot = join(root, ".opencode", "devloom", "project")

    mkdirSync(projectRoot, { recursive: true })
    writeFileSync(join(projectRoot, "README.md"), "legacy")
    writeFileSync(join(projectRoot, "config.json"), JSON.stringify({ tracker: "github", gh: { enabled: true, owner: "o" } }))
    writeFileSync(join(projectRoot, "board.json"), JSON.stringify({ active: "TASK-9", cols: { doing: ["TASK-9", "TASK-10"], done: ["TASK-1"] } }))
    writeFileSync(join(projectRoot, "state.json"), JSON.stringify({ phase: "implementation", notes: ["n1", 2, null] }))

    const result = ensureProjectWorkspace(root)

    expect(result.config.tracker).toBe("github")
    expect(result.board.active).toBe("TASK-9")
    expect(result.board.cols.doing).toEqual(["TASK-9"])
    expect(result.state.phase).toBe("implementation")
    expect(result.state.ticket).toBe("TASK-9")
    expect(result.state.notes).toEqual(["n1"])
    expect(readFileSync(join(projectRoot, "README.md"), "utf8")).toContain("written in English")
  })
})
