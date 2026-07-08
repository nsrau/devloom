import { describe, expect, test, beforeEach, afterEach } from "@jest/globals"
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  constraintsFilePath,
  readConstraints,
  buildConstraintsGuard,
  DEFAULT_CONSTRAINTS,
} from "../src/constraints.js"

describe("constraints module", () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "devloom-constraints-"))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  describe("constraintsFilePath", () => {
    test("returns correct path", () => {
      const path = constraintsFilePath(dir)
      expect(path).toBe(join(dir, ".opencode", "devloom", "loop", "loop-constraints.md"))
    })
  })

  describe("readConstraints", () => {
    test("returns DEFAULT_CONSTRAINTS when file missing", () => {
      const result = readConstraints(dir)
      expect(result).toBe(DEFAULT_CONSTRAINTS)
    })

    test("reads custom constraints from file", () => {
      const path = constraintsFilePath(dir)
      mkdirSync(join(dir, ".opencode", "devloom", "loop"), { recursive: true })
      writeFileSync(path, "# Custom Rules\n\n1. First custom rule\n2. Second custom rule\n")
      const result = readConstraints(dir)
      expect(result).toContain("First custom rule")
      expect(result).toContain("Second custom rule")
    })

    test("falls back to defaults on read error", () => {
      const path = constraintsFilePath(dir)
      mkdirSync(join(dir, ".opencode", "devloom", "loop"), { recursive: true })
      writeFileSync(path, "")
      const result = readConstraints(dir)
      expect(result).toBe(DEFAULT_CONSTRAINTS)
    })
  })

  describe("buildConstraintsGuard", () => {
    test("formats constraints for injection", () => {
      const constraints = "# Test\n\n1. Run tests before commit\n2. Never push without review\n3. Pause if budget exceeded\n"
      const guard = buildConstraintsGuard(constraints)
      expect(guard).toContain("[loop-constraints]")
      expect(guard).toContain("Run tests before commit")
      expect(guard).toContain("Never push without review")
      expect(guard).toContain("Pause if budget exceeded")
    })

    test("handles empty constraints", () => {
      expect(buildConstraintsGuard("")).toBe("")
    })

    test("handles constraints with no numbered rules", () => {
      const guard = buildConstraintsGuard("# Just a title\nNo rules here")
      expect(guard).toBe("")
    })

    test("limits to first 3 rules", () => {
      const constraints = "# Many rules\n1. Rule 1\n2. Rule 2\n3. Rule 3\n4. Rule 4\n5. Rule 5\n"
      const guard = buildConstraintsGuard(constraints)
      expect(guard).toContain("Rule 1")
      expect(guard).toContain("Rule 2")
      expect(guard).toContain("Rule 3")
      expect(guard).not.toContain("Rule 4")
    })
  })
})
