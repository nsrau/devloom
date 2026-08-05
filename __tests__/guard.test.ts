import { describe, expect, test, beforeEach, afterEach } from "@jest/globals"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import {
  ORCHESTRATOR_AGENT,
  ORCH_TOOL_OUTPUT_LIMIT,
  bashWriteTargets,
  buildGuardText,
  clampToolOutput,
  isBlockedOrchestratorCall,
  readStateSummary,
  resetStateSummaryCache,
} from "../src/guard.js"

describe("readStateSummary", () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "devloom-guard-"))
    resetStateSummaryCache()
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
    resetStateSummaryCache()
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

  test("memoizes within the TTL and recomputes after a reset", () => {
    const projectRoot = join(dir, ".opencode", "devloom", "project")
    mkdirSync(projectRoot, { recursive: true })
    writeFileSync(join(projectRoot, "state.json"), JSON.stringify({ phase: "impl" }))

    expect(readStateSummary(dir)).toContain("phase=impl")

    // Same rootDir inside the TTL: the expensive git/fs fan-out must not re-run.
    writeFileSync(join(projectRoot, "state.json"), JSON.stringify({ phase: "verify" }))
    expect(readStateSummary(dir)).toContain("phase=impl")

    resetStateSummaryCache()
    expect(readStateSummary(dir)).toContain("phase=verify")
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
    expect(
      isBlockedOrchestratorCall("write", { filePath: "/repo/.opencode/devloom" })
    ).toBe(false)
  })

  test("never blocks read-only or task tools", () => {
    expect(isBlockedOrchestratorCall("read", { filePath: "src/index.ts" })).toBe(false)
    expect(isBlockedOrchestratorCall("task", {})).toBe(false)
    expect(isBlockedOrchestratorCall("bash", {})).toBe(false)
  })

  test("blocks traversal out of the devloom state dir", () => {
    expect(
      isBlockedOrchestratorCall("write", { filePath: ".opencode/devloom/../../src/app.ts" })
    ).toBe(true)
    expect(
      isBlockedOrchestratorCall("edit", { filePath: "/repo/.opencode/devloom/project/../../../src/a.ts" })
    ).toBe(true)
  })

  test("blocks bash commands that write outside the state dir", () => {
    expect(isBlockedOrchestratorCall("bash", { command: "echo x > src/index.ts" })).toBe(true)
    expect(isBlockedOrchestratorCall("bash", { command: "cat <<EOF >> src/a.ts\nx\nEOF" })).toBe(true)
    expect(isBlockedOrchestratorCall("bash", { command: "npm test | tee report.txt" })).toBe(true)
    expect(isBlockedOrchestratorCall("bash", { command: "cp .opencode/devloom/x.json src/x.json" })).toBe(true)
    expect(isBlockedOrchestratorCall("bash", { command: "mv src/a.ts src/b.ts" })).toBe(true)
    expect(isBlockedOrchestratorCall("bash", { command: "rm -rf src/legacy" })).toBe(true)
  })

  test("blocks in-place mutators outright", () => {
    expect(isBlockedOrchestratorCall("bash", { command: "sed -i 's/a/b/' src/a.ts" })).toBe(true)
    expect(
      isBlockedOrchestratorCall("bash", { command: "sed -i '' 's/a/b/' .opencode/devloom/project/state.json" })
    ).toBe(true)
    expect(isBlockedOrchestratorCall("bash", { command: "truncate -s 0 src/a.ts" })).toBe(true)
  })

  test("allows bash state persistence and read-only commands", () => {
    expect(
      isBlockedOrchestratorCall("bash", { command: "echo '{}' > .opencode/devloom/project/state.json" })
    ).toBe(false)
    expect(
      isBlockedOrchestratorCall("bash", { command: "node -e \"...\" >> .opencode/devloom/project/board.json" })
    ).toBe(false)
    expect(
      isBlockedOrchestratorCall("bash", { command: "rm -f .opencode/devloom/.tmp/scratch.txt" })
    ).toBe(false)
    expect(isBlockedOrchestratorCall("bash", { command: "npm test" })).toBe(false)
    expect(isBlockedOrchestratorCall("bash", { command: "git status --porcelain 2>&1" })).toBe(false)
    expect(isBlockedOrchestratorCall("bash", { command: "grep -rn 'foo' src/" })).toBe(false)
  })
})

describe("bashWriteTargets", () => {
  test("extracts redirection, tee, copy destination and rm arguments", () => {
    expect(bashWriteTargets("echo x > out.txt")).toEqual(["out.txt"])
    expect(bashWriteTargets("npm test | tee -a logs/run.log")).toEqual(["logs/run.log"])
    expect(bashWriteTargets("cp a.ts b.ts")).toEqual(["b.ts"])
    expect(bashWriteTargets("rm -rf dist coverage")).toEqual(["dist", "coverage"])
  })

  test("ignores fd duplication and read redirection", () => {
    expect(bashWriteTargets("git status 2>&1")).toEqual([])
    expect(bashWriteTargets("wc -l < input.txt")).toEqual([])
  })

  test("finds nothing in read-only commands", () => {
    expect(bashWriteTargets("npm run build && npm test")).toEqual([])
  })

  test("ignores '>' inside quoted strings", () => {
    expect(bashWriteTargets('echo "a > b" > out.txt')).toEqual(["out.txt"])
    expect(bashWriteTargets("printf '%s\\n' 'x > y'")).toEqual([])
  })

  test("skips heredoc bodies but keeps same-line redirects", () => {
    expect(bashWriteTargets("cat <<EOF >> src/a.ts\nx > /etc/hosts\nmore\nEOF")).toEqual(["src/a.ts"])
  })

  test("ignores /dev sinks and fd dups", () => {
    expect(bashWriteTargets("npm test > /dev/null 2>&1")).toEqual([])
    expect(bashWriteTargets("rm -f /dev/null")).toEqual([])
  })

  test("recurses into command substitution bodies", () => {
    expect(bashWriteTargets('git commit -m "$(date)"')).toEqual([])
    expect(bashWriteTargets("bash -c 'echo x > nested.txt'")).toEqual(["nested.txt"])
  })

  test("detects move/copy destination even with trailing fd redirects", () => {
    expect(bashWriteTargets("mv src/a.ts src/b.ts 2>&1")).toEqual(["src/b.ts"])
  })
})
