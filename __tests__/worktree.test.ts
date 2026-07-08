import { describe, expect, test, beforeEach, afterEach } from "@jest/globals"
import { mkdtempSync, rmSync, existsSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execSync } from "node:child_process"
import {
  createWorktree,
  mergeWorktree,
  removeWorktree,
  listWorktrees,
  worktreeStatus,
  cleanWorktrees,
  readWorktreeSummary,
  getCurrentBranch,
  isClean,
} from "../src/worktree.js"

function setupRepo(dir: string): void {
  execSync("git init", { cwd: dir, encoding: "utf8", timeout: 10000 })
  execSync('git config user.email "test@test.com"', { cwd: dir, encoding: "utf8" })
  execSync('git config user.name "Test"', { cwd: dir, encoding: "utf8" })
  execSync('git config commit.gpgsign false', { cwd: dir, encoding: "utf8" })
  writeFileSync(join(dir, "README.md"), "# Test\n")
  execSync("git add -A", { cwd: dir, encoding: "utf8" })
  execSync('git commit -m "initial"', { cwd: dir, encoding: "utf8" })
}

describe("worktree module", () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "devloom-wt-"))
    setupRepo(dir)
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  describe("getCurrentBranch / isClean", () => {
    test("returns current branch name", () => {
      expect(getCurrentBranch(dir)).toBe("master")
    })

    test("returns true for clean repo", () => {
      expect(isClean(dir)).toBe(true)
    })

    test("returns false for dirty repo", () => {
      writeFileSync(join(dir, "new.txt"), "content")
      expect(isClean(dir)).toBe(false)
    })
  })

  describe("createWorktree", () => {
    test("creates a worktree on a new branch", () => {
      const entry = createWorktree(dir, "devloom/T-1/developer")
      expect(entry.branch).toBe("devloom/T-1/developer")
      expect(existsSync(entry.path)).toBe(true)
      expect(entry.ticket).toBe("T-1")
      expect(entry.agent).toBe("developer")
    })

    test("worktree has its own working copy", () => {
      const entry = createWorktree(dir, "devloom/T-1/developer")
      expect(existsSync(join(entry.path, "README.md"))).toBe(true)
    })

    test("auto-commits dirty changes before creating worktree", () => {
      writeFileSync(join(dir, "dirty.txt"), "uncommitted")
      const entry = createWorktree(dir, "devloom/T-1/developer")
      expect(existsSync(entry.path)).toBe(true)
      expect(isClean(dir)).toBe(true)
    })

    test("throws if not a git repo", () => {
      const nonGit = mkdtempSync(join(tmpdir(), "devloom-nogit-"))
      try {
        expect(() => createWorktree(nonGit, "devloom/T-1/dev")).toThrow("not a git repository")
      } finally {
        rmSync(nonGit, { recursive: true, force: true })
      }
    })

    test("replaces existing worktree with same branch name", () => {
      createWorktree(dir, "devloom/T-1/developer")
      const entry2 = createWorktree(dir, "devloom/T-1/developer")
      expect(existsSync(entry2.path)).toBe(true)
    })
  })

  describe("listWorktrees", () => {
    test("returns empty array for repo with no worktrees", () => {
      expect(listWorktrees(dir)).toEqual([])
    })

    test("lists created worktrees", () => {
      createWorktree(dir, "devloom/T-1/developer")
      createWorktree(dir, "devloom/T-1/qa")
      const list = listWorktrees(dir)
      expect(list).toHaveLength(2)
      expect(list.map((w) => w.branch).sort()).toEqual(["devloom/T-1/developer", "devloom/T-1/qa"])
    })

    test("returns empty for non-git dir", () => {
      const nonGit = mkdtempSync(join(tmpdir(), "devloom-nogit-"))
      try {
        expect(listWorktrees(nonGit)).toEqual([])
      } finally {
        rmSync(nonGit, { recursive: true, force: true })
      }
    })
  })

  describe("worktreeStatus", () => {
    test("returns status for existing worktree", () => {
      createWorktree(dir, "devloom/T-1/developer")
      const st = worktreeStatus(dir, "devloom/T-1/developer")
      expect(st.exists).toBe(true)
      expect(st.clean).toBe(true)
      expect(st.ahead).toBe(0)
      expect(st.behind).toBe(0)
      expect(st.ticket).toBe("T-1")
      expect(st.agent).toBe("developer")
    })

    test("returns not-exists for unknown branch", () => {
      const st = worktreeStatus(dir, "devloom/unknown/dev")
      expect(st.exists).toBe(false)
    })

    test("detects dirty worktree", () => {
      const entry = createWorktree(dir, "devloom/T-1/developer")
      writeFileSync(join(entry.path, "new.txt"), "content")
      const st = worktreeStatus(dir, "devloom/T-1/developer")
      expect(st.clean).toBe(false)
    })

    test("detects ahead commits", () => {
      const entry = createWorktree(dir, "devloom/T-1/developer")
      writeFileSync(join(entry.path, "new.txt"), "content")
      execSync("git add -A && git commit -m 'work in worktree'", { cwd: entry.path, encoding: "utf8" })
      const st = worktreeStatus(dir, "devloom/T-1/developer")
      expect(st.ahead).toBe(1)
    })
  })

  describe("mergeWorktree", () => {
    test("merges worktree changes back to main branch", () => {
      const entry = createWorktree(dir, "devloom/T-1/developer")
      writeFileSync(join(entry.path, "feature.txt"), "new feature")
      execSync("git add -A && git commit -m 'add feature'", { cwd: entry.path, encoding: "utf8" })

      const result = mergeWorktree(dir, "devloom/T-1/developer")
      expect(result.success).toBe(true)
      expect(result.mergedInto).toBe("master")
      expect(existsSync(join(dir, "feature.txt"))).toBe(true)
      expect(existsSync(entry.path)).toBe(false)
    })

    test("auto-commits dirty worktree before merge", () => {
      const entry = createWorktree(dir, "devloom/T-1/developer")
      writeFileSync(join(entry.path, "uncommitted.txt"), "content")

      const result = mergeWorktree(dir, "devloom/T-1/developer")
      expect(result.success).toBe(true)
      expect(existsSync(join(dir, "uncommitted.txt"))).toBe(true)
    })

    test("throws if worktree not found", () => {
      expect(() => mergeWorktree(dir, "devloom/nonexistent/dev")).toThrow("worktree not found")
    })

    test("detects merge conflict and keeps worktree", () => {
      writeFileSync(join(dir, "shared.txt"), "original\n")
      execSync("git add -A && git commit -m 'add shared'", { cwd: dir, encoding: "utf8" })

      const entry = createWorktree(dir, "devloom/T-1/developer")

      writeFileSync(join(dir, "shared.txt"), "main change\n")
      execSync("git add -A && git commit -m 'main change'", { cwd: dir, encoding: "utf8" })

      writeFileSync(join(entry.path, "shared.txt"), "worktree change\n")
      execSync("git add -A && git commit -m 'worktree change'", { cwd: entry.path, encoding: "utf8" })

      const result = mergeWorktree(dir, "devloom/T-1/developer")
      expect(result.success).toBe(false)
      expect(result.conflicts.length).toBeGreaterThan(0)
      expect(result.conflicts).toContain("shared.txt")
      expect(existsSync(entry.path)).toBe(true)
    })
  })

  describe("removeWorktree", () => {
    test("removes a clean worktree", () => {
      createWorktree(dir, "devloom/T-1/developer")
      const result = removeWorktree(dir, "devloom/T-1/developer")
      expect(result.removed).toBe(true)
      expect(listWorktrees(dir)).toHaveLength(0)
    })

    test("throws on dirty worktree without force", () => {
      const entry = createWorktree(dir, "devloom/T-1/developer")
      writeFileSync(join(entry.path, "dirty.txt"), "content")
      expect(() => removeWorktree(dir, "devloom/T-1/developer")).toThrow("uncommitted changes")
    })

    test("force removes dirty worktree", () => {
      const entry = createWorktree(dir, "devloom/T-1/developer")
      writeFileSync(join(entry.path, "dirty.txt"), "content")
      const result = removeWorktree(dir, "devloom/T-1/developer", true)
      expect(result.removed).toBe(true)
    })

    test("returns not-found for unknown worktree", () => {
      const result = removeWorktree(dir, "devloom/nonexistent/dev")
      expect(result.removed).toBe(false)
    })
  })

  describe("cleanWorktrees", () => {
    test("removes merged worktrees", () => {
      const entry = createWorktree(dir, "devloom/T-1/developer")
      writeFileSync(join(entry.path, "feat.txt"), "content")
      execSync("git add -A && git commit -m 'feat'", { cwd: entry.path, encoding: "utf8" })
      mergeWorktree(dir, "devloom/T-1/developer")

      createWorktree(dir, "devloom/T-2/qa")

      const results = cleanWorktrees(dir)
      expect(results).toHaveLength(1)
      expect(results[0].branch).toBe("devloom/T-2/qa")
      expect(results[0].removed).toBe(false)
      expect(results[0].reason).toContain("unmerged")
    })

    test("force removes all worktrees", () => {
      createWorktree(dir, "devloom/T-1/developer")
      createWorktree(dir, "devloom/T-2/qa")
      const results = cleanWorktrees(dir, true)
      expect(results).toHaveLength(2)
      expect(results.every((r) => r.removed)).toBe(true)
      expect(listWorktrees(dir)).toHaveLength(0)
    })

    test("returns empty for no worktrees", () => {
      expect(cleanWorktrees(dir)).toEqual([])
    })
  })

  describe("readWorktreeSummary", () => {
    test("returns worktrees=0 when none exist", () => {
      expect(readWorktreeSummary(dir)).toBe("worktrees=0")
    })

    test("returns count with dirty status", () => {
      createWorktree(dir, "devloom/T-1/developer")
      const summary = readWorktreeSummary(dir)
      expect(summary).toBe("worktrees=1 dirty=0")
    })

    test("counts dirty worktrees", () => {
      const entry = createWorktree(dir, "devloom/T-1/developer")
      createWorktree(dir, "devloom/T-2/qa")
      writeFileSync(join(entry.path, "dirty.txt"), "content")
      const summary = readWorktreeSummary(dir)
      expect(summary).toBe("worktrees=2 dirty=1")
    })
  })
})
