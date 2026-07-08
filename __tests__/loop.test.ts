import { describe, expect, test, beforeEach, afterEach } from "@jest/globals"
import { mkdtempSync, rmSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  readLoopConfig,
  writeLoopConfig,
  readRunLog,
  appendRunLog,
  readBudget,
  writeBudget,
  checkBudget,
  recordSpend,
  shouldPause,
  ensureLoopWorkspace,
  readLoopStateSummary,
  progressFilePath,
  readProgress,
  writeProgress,
  initUntilDoneProgress,
  updateProgressItem,
  checkCompletionCondition,
  progressByCategory,
} from "../src/loop.js"

describe("loop module", () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "devloom-loop-"))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  describe("ensureLoopWorkspace", () => {
    test("creates loop dir with defaults", () => {
      ensureLoopWorkspace(dir)
      const loopDir = join(dir, ".opencode", "devloom", "loop")
      expect(existsSync(loopDir)).toBe(true)
      expect(existsSync(join(loopDir, "loop-config.json"))).toBe(true)
      expect(existsSync(join(loopDir, "budget.json"))).toBe(true)
      expect(existsSync(join(loopDir, "run-log.json"))).toBe(true)
      expect(existsSync(join(loopDir, "loop-constraints.md"))).toBe(true)

      const config = readLoopConfig(dir)
      expect(config.pattern).toBe("")
      expect(config.cadence).toBe("0 0 * * *")
      expect(config.level).toBe("L1")

      const budget = readBudget(dir)
      expect(budget.dailyLimit).toBe(500000)
      expect(budget.spent).toBe(0)
    })

    test("is idempotent when called again", () => {
      ensureLoopWorkspace(dir)
      expect(() => ensureLoopWorkspace(dir)).not.toThrow()
    })
  })

  describe("writeLoopConfig / readLoopConfig", () => {
    test("round-trips config", () => {
      ensureLoopWorkspace(dir)
      writeLoopConfig(dir, { pattern: "daily-triage", cadence: "0 6 * * *", level: "L1", paused: false })
      const config = readLoopConfig(dir)
      expect(config.pattern).toBe("daily-triage")
      expect(config.cadence).toBe("0 6 * * *")
      expect(config.level).toBe("L1")
    })

    test("readLoopConfig returns defaults when no file", () => {
      const config = readLoopConfig(dir)
      expect(config.pattern).toBe("")
      expect(config.cadence).toBe("0 0 * * *")
      expect(config.level).toBe("L1")
    })
  })

  describe("appendRunLog / readRunLog", () => {
    test("returns entries in order", () => {
      ensureLoopWorkspace(dir)
      appendRunLog(dir, {
        timestamp: "2026-07-08T06:00:00Z",
        pattern: "daily-triage",
        agentsUsed: ["verifier", "documenter"],
        outcome: "success",
        tokenCost: 50000,
        durationMs: 1200,
      })
      appendRunLog(dir, {
        timestamp: "2026-07-08T07:00:00Z",
        pattern: "ci-sweeper",
        agentsUsed: ["developer"],
        outcome: "failure",
        tokenCost: 30000,
        durationMs: 800,
        error: "test failed",
      })
      const entries = readRunLog(dir)
      expect(entries).toHaveLength(2)
      expect(entries[0].pattern).toBe("daily-triage")
      expect(entries[1].pattern).toBe("ci-sweeper")
      expect(entries[1].error).toBe("test failed")
    })

    test("readRunLog respects limit parameter", () => {
      ensureLoopWorkspace(dir)
      for (let i = 0; i < 10; i++) {
        appendRunLog(dir, {
          timestamp: `2026-07-08T0${i}:00:00Z`,
          pattern: "test",
          agentsUsed: [],
          outcome: "success",
          tokenCost: 1000,
          durationMs: 100,
        })
      }
      const limited = readRunLog(dir, 3)
      expect(limited).toHaveLength(3)
    })

  })

  describe("checkBudget", () => {
    test("returns allowed when under limit", () => {
      ensureLoopWorkspace(dir)
      const result = checkBudget(dir)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(500000)
    })

    test("returns disallowed when spent exceeds limit", () => {
      ensureLoopWorkspace(dir)
      writeBudget(dir, { dailyLimit: 100000, spent: 100000, resetAt: new Date(Date.now() + 86400000).toISOString() })
      const result = checkBudget(dir)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    test("resets budget after reset time", () => {
      ensureLoopWorkspace(dir)
      const yesterday = new Date(Date.now() - 86400000).toISOString()
      writeBudget(dir, { dailyLimit: 100000, spent: 100000, resetAt: yesterday })
      const result = checkBudget(dir)
      expect(result.allowed).toBe(true)
    })
  })

  describe("recordSpend", () => {
    test("updates spent correctly", () => {
      ensureLoopWorkspace(dir)
      recordSpend(dir, 50000)
      const budget = readBudget(dir)
      expect(budget.spent).toBe(50000)
    })

    test("accumulates multiple spends", () => {
      ensureLoopWorkspace(dir)
      recordSpend(dir, 30000)
      recordSpend(dir, 20000)
      const budget = readBudget(dir)
      expect(budget.spent).toBe(50000)
    })
  })

  describe("shouldPause", () => {
    test("returns true when over limit and sets config paused", () => {
      ensureLoopWorkspace(dir)
      writeBudget(dir, { dailyLimit: 1000, spent: 1000, resetAt: new Date(Date.now() + 86400000).toISOString() })
      writeLoopConfig(dir, { pattern: "daily-triage", cadence: "0 6 * * *", level: "L1", paused: false })
      expect(shouldPause(dir)).toBe(true)
      const config = readLoopConfig(dir)
      expect(config.paused).toBe(true)
    })
  })

  describe("readLoopStateSummary", () => {
    test("returns inactive when no config", () => {
      expect(readLoopStateSummary(dir)).toBe("loop=inactive")
    })

    test("returns pattern info when config exists", () => {
      ensureLoopWorkspace(dir)
      writeLoopConfig(dir, { pattern: "daily-triage", cadence: "0 6 * * *", level: "L1", paused: false })
      const summary = readLoopStateSummary(dir)
      expect(summary).toContain("loop=daily-triage")
      expect(summary).toContain("lastRun=never")
      expect(summary).toContain("paused=false")
    })

    test("includes lastRun when run log exists", () => {
      ensureLoopWorkspace(dir)
      writeLoopConfig(dir, { pattern: "daily-triage", cadence: "0 6 * * *", level: "L1", paused: false })
      appendRunLog(dir, {
        timestamp: "2026-07-08T06:00:00Z",
        pattern: "daily-triage",
        agentsUsed: [],
        outcome: "success",
        tokenCost: 50000,
        durationMs: 1000,
      })
      const summary = readLoopStateSummary(dir)
      expect(summary).toContain("lastRun=2026-07-08T06:00:00Z")
    })
  })

  describe("until-done mode", () => {
    test("LoopConfig supports mode field", () => {
      ensureLoopWorkspace(dir)
      writeLoopConfig(dir, {
        pattern: "design-audit",
        cadence: "on-demand",
        level: "L1",
        paused: false,
        mode: "until-done",
      })
      const config = readLoopConfig(dir)
      expect(config.mode).toBe("until-done")
    })

    test("progressFilePath returns correct path", () => {
      const path = progressFilePath(dir)
      expect(path).toBe(join(dir, ".opencode", "devloom", "loop", "progress.json"))
    })

    test("readProgress returns null when no file", () => {
      const progress = readProgress(dir)
      expect(progress).toBeNull()
    })

    test("writeProgress / readProgress round-trips", () => {
      const progress = initUntilDoneProgress(
        [{ id: "page-1", status: "pending" }, { id: "page-2", status: "pending" }],
        "All pages verified against design system spec"
      )
      writeProgress(dir, progress)
      const loaded = readProgress(dir)
      expect(loaded).not.toBeNull()
      expect(loaded!.total).toBe(2)
      expect(loaded!.done).toBe(0)
      expect(loaded!.verified).toBe(0)
      expect(loaded!.completionCondition).toBe("All pages verified against design system spec")
      expect(loaded!.items).toHaveLength(2)
    })

    test("initUntilDoneProgress creates correct initial state", () => {
      const items = [
        { id: "page-1", status: "pending" as const },
        { id: "page-2", status: "pending" as const },
        { id: "page-3", status: "pending" as const },
      ]
      const progress = initUntilDoneProgress(items, "All 3 pages verified")
      expect(progress.total).toBe(3)
      expect(progress.done).toBe(0)
      expect(progress.verified).toBe(0)
      expect(progress.completionCondition).toBe("All 3 pages verified")
    })

    test("updateProgressItem updates single item status and recalculates counts", () => {
      const items = [
        { id: "page-1", status: "pending" as const },
        { id: "page-2", status: "pending" as const },
      ]
      const progress = initUntilDoneProgress(items, "All verified")

      updateProgressItem(progress, "page-1", "in-progress")
      expect(progress.items[0].status).toBe("in-progress")
      expect(progress.done).toBe(0)
      expect(progress.verified).toBe(0)

      updateProgressItem(progress, "page-1", "done")
      expect(progress.items[0].status).toBe("done")
      expect(progress.done).toBe(1)
      expect(progress.verified).toBe(0)

      updateProgressItem(progress, "page-1", "verified")
      expect(progress.items[0].status).toBe("verified")
      expect(progress.done).toBe(1)
      expect(progress.verified).toBe(1)

      updateProgressItem(progress, "page-2", "verified")
      expect(progress.done).toBe(2)
      expect(progress.verified).toBe(2)
    })

    test("checkCompletionCondition returns true only when all verified", () => {
      const items = [
        { id: "page-1", status: "pending" as const },
        { id: "page-2", status: "pending" as const },
      ]
      const progress = initUntilDoneProgress(items, "All verified")

      expect(checkCompletionCondition(progress)).toBe(false)

      updateProgressItem(progress, "page-1", "verified")
      expect(checkCompletionCondition(progress)).toBe(false)

      updateProgressItem(progress, "page-2", "verified")
      expect(checkCompletionCondition(progress)).toBe(true)
    })

    test("readLoopStateSummary includes until-done progress", () => {
      ensureLoopWorkspace(dir)
      const items = [
        { id: "page-1", status: "verified" as const },
        { id: "page-2", status: "pending" as const },
      ]
      const progress = initUntilDoneProgress(items, "All verified")
      writeLoopConfig(dir, {
        pattern: "design-audit",
        cadence: "on-demand",
        level: "L1",
        paused: false,
        mode: "until-done",
        progress,
      })
      const summary = readLoopStateSummary(dir)
      expect(summary).toContain("loop=design-audit")
      expect(summary).toContain("until-done")
      expect(summary).toContain("verified=1/2")
    })

    test("UntilDoneItem supports category and severity fields", () => {
      const items = [
        { id: "issue-1", status: "pending" as const, category: "broken-action" as const, severity: "critical" as const },
        { id: "issue-2", status: "pending" as const, category: "ui" as const, severity: "low" as const },
        { id: "issue-3", status: "pending" as const, category: "missing-action" as const, severity: "high" as const },
      ]
      const progress = initUntilDoneProgress(items, "All verified")
      expect(progress.items[0].category).toBe("broken-action")
      expect(progress.items[0].severity).toBe("critical")
      expect(progress.items[1].category).toBe("ui")
      expect(progress.items[2].category).toBe("missing-action")
    })

    test("progressByCategory counts items per category", () => {
      const items = [
        { id: "i1", status: "pending" as const, category: "ui" as const },
        { id: "i2", status: "pending" as const, category: "ui" as const },
        { id: "i3", status: "pending" as const, category: "broken-action" as const },
        { id: "i4", status: "pending" as const, category: "api" as const },
      ]
      const progress = initUntilDoneProgress(items, "All verified")
      const counts = progressByCategory(progress)
      expect(counts["ui"]).toBe(2)
      expect(counts["broken-action"]).toBe(1)
      expect(counts["api"]).toBe(1)
    })

    test("writeProgress / readProgress preserves category and severity", () => {
      ensureLoopWorkspace(dir)
      const items = [
        { id: "i1", status: "pending" as const, category: "broken-action" as const, severity: "critical" as const },
      ]
      const progress = initUntilDoneProgress(items, "All verified")
      writeProgress(dir, progress)
      const loaded = readProgress(dir)
      expect(loaded).not.toBeNull()
      expect(loaded!.items[0].category).toBe("broken-action")
      expect(loaded!.items[0].severity).toBe("critical")
    })
  })
})
