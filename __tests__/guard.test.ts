import { describe, expect, test, beforeEach, afterEach } from "@jest/globals"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import {
  ORCHESTRATOR_AGENT,
  ORCH_TOOL_OUTPUT_LIMIT,
  buildGuardText,
  clampToolOutput,
  isBlockedOrchestratorCall,
  readStateSummary,
} from "../src/guard.js"

describe("readStateSummary", () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "devloom-guard-"))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  test("returns unbootstrapped when no state file exists", () => {
    expect(readStateSummary(dir)).toBe("unbootstrapped")
  })

  test("summarizes phase, ticket, next and board counts", () => {
    const projectRoot = join(dir, ".opencode", "devloom", "project")
    mkdirSync(projectRoot, { recursive: true })
    writeFileSync(
      join(projectRoot, "state.json"),
      JSON.stringify({ phase: "impl", ticket: "T-1", next: "verify" })
    )
    writeFileSync(
      join(projectRoot, "board.json"),
      JSON.stringify({ cols: { doing: ["T-1"], backlog: ["T-2", "T-3"] } })
    )
    const summary = readStateSummary(dir)
    expect(summary).toContain("phase=impl ticket=T-1 next=verify doing=1 backlog=2")
    expect(summary).toContain("worktrees=")
    expect(summary).toContain("context=")
  })

  test("tolerates malformed board file", () => {
    const projectRoot = join(dir, ".opencode", "devloom", "project")
    mkdirSync(projectRoot, { recursive: true })
    writeFileSync(join(projectRoot, "state.json"), JSON.stringify({ phase: "idle" }))
    writeFileSync(join(projectRoot, "board.json"), "{not json")
    const summary = readStateSummary(dir)
    expect(summary).toContain("phase=idle ticket=- next=- doing=0 backlog=0")
    expect(summary).toContain("worktrees=")
    expect(summary).toContain("context=")
  })
})

describe("buildGuardText", () => {
  test("main agent gets routing rule with state", () => {
    const text = buildGuardText("build", "phase=idle ticket=- next=analysis doing=0 backlog=0")
    expect(text).toContain('task(subagent:"devloom-orchestrator"')
    expect(text).toContain("phase=idle")
  })

  test("undefined agent gets routing rule", () => {
    expect(buildGuardText(undefined, "unbootstrapped")).toContain("devloom-orchestrator")
  })

  test("orchestrator gets delegation protocol", () => {
    const text = buildGuardText(ORCHESTRATOR_AGENT, "phase=impl ticket=T-1 next=verify doing=1 backlog=0")
    expect(text).toContain("delegate ALL phase work via task()")
    expect(text).toContain("DEVLOOM_DONE")
    expect(text).toContain("phase=impl")
  })

  test("devloom worker agents get compliance guard", () => {
    const guard = buildGuardText("devloom-developer", "unbootstrapped")
    expect(guard).not.toBeNull()
    expect(guard).toContain("COMPLIANCE")
    expect(guard).toContain("skill file")
  })
})

describe("clampToolOutput", () => {
  test("passes short output through unchanged", () => {
    expect(clampToolOutput("ok")).toBe("ok")
  })

  test("truncates oversized output with marker, keeping head and tail", () => {
    const big = "a".repeat(ORCH_TOOL_OUTPUT_LIMIT + 5000) + "TAIL"
    const clamped = clampToolOutput(big)
    expect(clamped.length).toBeLessThan(big.length)
    expect(clamped).toContain("[devloom-guard] output truncated")
    expect(clamped.endsWith("TAIL")).toBe(true)
  })
})

describe("isBlockedOrchestratorCall", () => {
  test("blocks write/edit/patch outside devloom state dir", () => {
    expect(isBlockedOrchestratorCall("write", { filePath: "src/index.ts" })).toBe(true)
    expect(isBlockedOrchestratorCall("edit", { filePath: "/repo/app/main.py" })).toBe(true)
    expect(isBlockedOrchestratorCall("patch", {})).toBe(true)
  })

  test("allows state writes under .opencode/devloom/", () => {
    expect(
      isBlockedOrchestratorCall("write", { filePath: "/repo/.opencode/devloom/project/state.json" })
    ).toBe(false)
    expect(
      isBlockedOrchestratorCall("edit", { filePath: ".opencode\\devloom\\project\\board.json" })
    ).toBe(false)
  })

  test("never blocks read-only or task tools", () => {
    expect(isBlockedOrchestratorCall("read", { filePath: "src/index.ts" })).toBe(false)
    expect(isBlockedOrchestratorCall("task", {})).toBe(false)
    expect(isBlockedOrchestratorCall("bash", {})).toBe(false)
  })
})
