import { describe, expect, test } from "@jest/globals"
import { readFileSync } from "fs"

const read = (path: string) => readFileSync(path, "utf8")

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
  })

  test("main command references board persistence", () => {
    const command = read("commands/devloom.md")
    expect(command).toContain(".opencode/devloom/project/board.json")
    expect(command).toContain("English-only")
    expect(command).toContain("normalize existing project files")
    expect(command).toContain("append every prompt as the last task/todo")
  })

  test("save command persists state and pauses", () => {
    const command = read("commands/devloom-save.md")
    expect(command).toContain("next=user-command")
    expect(command).toContain("Pause")
    expect(command).toContain("state persisted")
  })
})
