import { describe, expect, test, beforeEach, afterEach } from "@jest/globals"
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  detectTechStack,
  generateContext,
  readContextSummary,
  readContext,
  contextSummaryString,
  autoGenerateContextIfMissing,
  contextFilePath,
  MVI_MAX_LINES,
} from "../src/context.js"

function setupProject(dir: string): void {
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      name: "test-app",
      dependencies: {
        next: "14.0.0",
        react: "18.0.0",
        drizzle: "0.30.0",
        "drizzle-orm": "0.30.0",
        zod: "3.22.0",
        postgres: "3.4.0",
      },
      devDependencies: {
        typescript: "5.4.0",
        jest: "29.7.0",
        eslint: "8.57.0",
        tailwindcss: "3.4.0",
      },
      scripts: {
        test: "jest",
        typecheck: "tsc --noEmit",
      },
    })
  )
  writeFileSync(join(dir, "tsconfig.json"), '{"compilerOptions":{"strict":true}}')
  writeFileSync(join(dir, "package-lock.json"), "{}")
  mkdirSync(join(dir, "src", "app", "api", "users"), { recursive: true })
  writeFileSync(join(dir, "src", "app", "api", "users", "route.ts"), "export async function POST() { return Response.json({}) }")
  mkdirSync(join(dir, "src", "components"), { recursive: true })
  writeFileSync(join(dir, "src", "components", "Button.tsx"), "export function Button() { return null }")
}

describe("context module", () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "devloom-ctx-"))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  describe("detectTechStack", () => {
    test("detects TypeScript + Next.js + Drizzle from package.json", () => {
      setupProject(dir)
      const stack = detectTechStack(dir)
      expect(stack.language).toBe("TypeScript")
      expect(stack.framework).toBe("Next.js")
      expect(stack.orm).toBe("Drizzle")
      expect(stack.validation).toBe("Zod")
      expect(stack.testing).toBe("Jest")
      expect(stack.linter).toBe("ESLint")
      expect(stack.packageManager).toBe("npm")
    })

    test("detects Go from go.mod", () => {
      writeFileSync(join(dir, "go.mod"), "module test\ngo 1.21\n")
      const stack = detectTechStack(dir)
      expect(stack.language).toBe("Go")
      expect(stack.packageManager).toBe("go mod")
    })

    test("detects Python from pyproject.toml", () => {
      writeFileSync(join(dir, "pyproject.toml"), "[project]\nname = 'test'\n")
      const stack = detectTechStack(dir)
      expect(stack.language).toBe("Python")
    })

    test("detects Rust from Cargo.toml", () => {
      writeFileSync(join(dir, "Cargo.toml"), "[package]\nname = 'test'\n")
      const stack = detectTechStack(dir)
      expect(stack.language).toBe("Rust")
      expect(stack.packageManager).toBe("cargo")
    })

    test("returns Unknown for empty directory", () => {
      const stack = detectTechStack(dir)
      expect(stack.language).toBe("Unknown")
      expect(stack.framework).toBe("Unknown")
    })

    test("detects key libraries", () => {
      setupProject(dir)
      const stack = detectTechStack(dir)
      expect(stack.keyLibraries).toContain("zod")
      expect(stack.keyLibraries).toContain("drizzle-orm")
    })
  })

  describe("generateContext", () => {
    test("generates 4 context files from project", () => {
      setupProject(dir)
      const result = generateContext(dir, true)
      expect(result.generated).toHaveLength(4)
      expect(result.generated).toContain("project.md")
      expect(result.generated).toContain("conventions.md")
      expect(result.generated).toContain("security.md")
      expect(result.generated).toContain("examples.md")
    })

    test("skips existing files without force", () => {
      setupProject(dir)
      generateContext(dir, true)
      const result = generateContext(dir, false)
      expect(result.skipped).toHaveLength(4)
      expect(result.generated).toHaveLength(0)
    })

    test("overwrites with force", () => {
      setupProject(dir)
      generateContext(dir, true)
      const result = generateContext(dir, true)
      expect(result.generated).toHaveLength(4)
      expect(result.skipped).toHaveLength(0)
    })

    test("project.md contains detected tech stack", () => {
      setupProject(dir)
      generateContext(dir, true)
      const content = readFileSync(contextFilePath(dir, "project.md"), "utf8")
      expect(content).toContain("TypeScript")
      expect(content).toContain("Next.js")
      expect(content).toContain("Drizzle")
    })

    test("conventions.md contains naming conventions", () => {
      setupProject(dir)
      generateContext(dir, true)
      const content = readFileSync(contextFilePath(dir, "conventions.md"), "utf8")
      expect(content).toContain("PascalCase")
      expect(content).toContain("camelCase")
    })

    test("security.md contains detected security patterns", () => {
      setupProject(dir)
      generateContext(dir, true)
      const content = readFileSync(contextFilePath(dir, "security.md"), "utf8")
      expect(content).toContain("Zod")
      expect(content).toContain("Never trust user input")
    })

    test("examples.md extracts API example from codebase", () => {
      setupProject(dir)
      generateContext(dir, true)
      const content = readFileSync(contextFilePath(dir, "examples.md"), "utf8")
      expect(content).toContain("API Endpoint Pattern")
      expect(content).toContain("POST")
    })

    test("examples.md ignores node_modules and other vendored dirs", () => {
      setupProject(dir)
      // A malicious/vendored route inside node_modules must never be picked up
      // as the project's API pattern.
      mkdirSync(join(dir, "node_modules", "evil", "api"), { recursive: true })
      writeFileSync(join(dir, "node_modules", "evil", "api", "route.ts"), "export async function EVIL() {}")
      writeFileSync(join(dir, "node_modules", "index.ts"), "export const x = 1")
      generateContext(dir, true)
      const content = readFileSync(contextFilePath(dir, "examples.md"), "utf8")
      expect(content).toContain("POST")
      expect(content).not.toContain("EVIL")
    })

    test("all generated files are under MVI limit (200 lines)", () => {
      setupProject(dir)
      generateContext(dir, true)
      const summary = readContextSummary(dir)
      for (const f of summary.files) {
        if (f.exists) {
          expect(f.lines).toBeLessThanOrEqual(MVI_MAX_LINES)
          expect(f.overLimit).toBe(false)
        }
      }
    })
  })

  describe("readContextSummary", () => {
    test("returns hasContext=false for empty dir", () => {
      const summary = readContextSummary(dir)
      expect(summary.hasContext).toBe(false)
      expect(summary.totalLines).toBe(0)
    })

    test("returns hasContext=true after generation", () => {
      setupProject(dir)
      generateContext(dir, true)
      const summary = readContextSummary(dir)
      expect(summary.hasContext).toBe(true)
      expect(summary.files.filter((f) => f.exists)).toHaveLength(4)
    })
  })

  describe("contextSummaryString", () => {
    test("returns context=none when no context exists", () => {
      expect(contextSummaryString(dir)).toBe("context=none")
    })

    test("returns context count and line count", () => {
      setupProject(dir)
      generateContext(dir, true)
      const str = contextSummaryString(dir)
      expect(str).toContain("context=4")
      expect(str).toContain("lines=")
    })
  })

  describe("autoGenerateContextIfMissing", () => {
    test("generates context when none exists", () => {
      setupProject(dir)
      const result = autoGenerateContextIfMissing(dir)
      expect(result).toBe(true)
      expect(existsSync(contextFilePath(dir, "project.md"))).toBe(true)
    })

    test("does nothing when context already exists", () => {
      setupProject(dir)
      generateContext(dir, true)
      const result = autoGenerateContextIfMissing(dir)
      expect(result).toBe(false)
    })
  })

  describe("readContext", () => {
    test("returns empty strings for missing context", () => {
      const ctx = readContext(dir)
      expect(ctx["project.md"]).toBe("")
      expect(ctx["conventions.md"]).toBe("")
    })

    test("returns file contents after generation", () => {
      setupProject(dir)
      generateContext(dir, true)
      const ctx = readContext(dir)
      expect(ctx["project.md"]).toContain("TypeScript")
      expect(ctx["security.md"]).toContain("Security")
    })
  })
})
