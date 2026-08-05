import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, statSync, Dirent } from "node:fs"
import { join, basename } from "node:path"

export const CONTEXT_DIR = [".opencode", "devloom", "context"]
export const CONTEXT_FILES = ["project.md", "conventions.md", "security.md", "examples.md"] as const
export const MVI_MAX_LINES = 200

/** Directories that must never influence project-wide detection or example extraction. */
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "coverage", "build", "out", ".next", ".devloom-worktrees"])

/**
 * Walk a directory tree, pruning ignored dirs, and return up to `max` file paths
 * RELATIVE to `dir`, sorted for determinism. `readdirSync({ recursive: true })`
 * enumerates the whole tree every call — including node_modules — which is
 * O(tree) I/O on every plugin init. `walkProject` skips ignored dirs up front;
 * the returned cap is applied AFTER collection so callers always see files in a
 * stable order rather than whatever directory traversal happened to hit first.
 */
function walkProject(dir: string, max = 100): string[] {
  const results: string[] = []
  const stack: Array<[string, string]> = [[dir, ""]]
  while (stack.length > 0) {
    const [abs, rel] = stack.pop()!
    let entries: Dirent[]
    try {
      entries = readdirSync(abs, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name)) continue
      const relPath = rel ? `${rel}/${entry.name}` : entry.name
      if (entry.isDirectory()) stack.push([join(abs, entry.name), relPath])
      else results.push(relPath)
    }
  }
  return results.sort().slice(0, max)
}

export type ContextFile = (typeof CONTEXT_FILES)[number]

export type ContextSummary = {
  hasContext: boolean
  files: Array<{ name: ContextFile; exists: boolean; lines: number; overLimit: boolean }>
  totalLines: number
}

type PackageJson = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  scripts?: Record<string, string>
  name?: string
}

type TechStack = {
  language: string
  framework: string
  orm: string
  database: string
  styling: string
  validation: string
  testing: string
  linter: string
  typeCheck: string
  packageManager: string
  keyLibraries: string[]
}

function contextDir(rootDir: string): string {
  return join(rootDir, ...CONTEXT_DIR)
}

export function contextFilePath(rootDir: string, file: ContextFile): string {
  return join(contextDir(rootDir), file)
}

export function readContextSummary(rootDir: string): ContextSummary {
  const dir = contextDir(rootDir)
  const files = CONTEXT_FILES.map((name) => {
    const path = join(dir, name)
    if (!existsSync(path)) {
      return { name, exists: false, lines: 0, overLimit: false }
    }
    const content = readFileSync(path, "utf8")
    const lines = content.split("\n").length
    return { name, exists: true, lines, overLimit: lines > MVI_MAX_LINES }
  })

  const totalLines = files.reduce((sum, f) => sum + f.lines, 0)
  const hasContext = files.some((f) => f.exists)

  return { hasContext, files, totalLines }
}

export function readContext(rootDir: string): Record<ContextFile, string> {
  const dir = contextDir(rootDir)
  const result = {} as Record<ContextFile, string>
  for (const name of CONTEXT_FILES) {
    const path = join(dir, name)
    result[name] = existsSync(path) ? readFileSync(path, "utf8") : ""
  }
  return result
}

export function contextSummaryString(rootDir: string): string {
  const summary = readContextSummary(rootDir)
  if (!summary.hasContext) return "context=none"
  const existing = summary.files.filter((f) => f.exists)
  const overLimit = existing.filter((f) => f.overLimit)
  const parts = [`context=${existing.length}`, `lines=${summary.totalLines}`]
  if (overLimit.length > 0) {
    parts.push(`overMVI=${overLimit.map((f) => f.name).join(",")}`)
  }
  return parts.join(" ")
}

export function ensureContextDir(rootDir: string): void {
  const dir = contextDir(rootDir)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T
  } catch {
    return fallback
  }
}

function readPackageJson(rootDir: string): PackageJson | null {
  const path = join(rootDir, "package.json")
  if (!existsSync(path)) return null
  return readJson<PackageJson>(path, {})
}

function hasFile(rootDir: string, ...segments: string[]): boolean {
  return existsSync(join(rootDir, ...segments))
}

function detectLanguage(rootDir: string, pkg: PackageJson | null): string {
  if (hasFile(rootDir, "tsconfig.json")) return "TypeScript"
  if (pkg && (pkg.dependencies?.typescript || pkg.devDependencies?.typescript)) return "TypeScript"
  if (hasFile(rootDir, "go.mod")) return "Go"
  if (hasFile(rootDir, "pyproject.toml") || hasFile(rootDir, "requirements.txt")) return "Python"
  if (hasFile(rootDir, "Cargo.toml")) return "Rust"
  if (hasFile(rootDir, "pom.xml") || hasFile(rootDir, "build.gradle")) return "Java"
  if (hasFile(rootDir, "Gemfile")) return "Ruby"
  if (pkg) return "JavaScript"
  return "Unknown"
}

function detectFramework(rootDir: string, pkg: PackageJson | null): string {
  if (!pkg) {
    if (hasFile(rootDir, "go.mod")) return "net/http or chi/gin"
    if (hasFile(rootDir, "pyproject.toml")) return "FastAPI/Django/Flask"
    if (hasFile(rootDir, "Cargo.toml")) return "axum/actix"
    return "Unknown"
  }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  if (deps.next) return "Next.js"
  if (deps.react) return "React"
  if (deps.vue) return "Vue"
  if (deps.svelte) return "Svelte"
  if (deps.fastify) return "Fastify"
  if (deps.express) return "Express"
  if (deps.hono) return "Hono"
  if (deps.nestjs) return "NestJS"
  if (deps["@nestjs/core"]) return "NestJS"
  return "Unknown"
}

function detectOrm(rootDir: string, pkg: PackageJson | null): string {
  if (!pkg) {
    if (hasFile(rootDir, "prisma", "schema.prisma")) return "Prisma"
    return "Unknown"
  }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  if (deps.drizzle) return "Drizzle"
  if (deps.prisma || hasFile(rootDir, "prisma", "schema.prisma")) return "Prisma"
  if (deps["@prisma/client"]) return "Prisma"
  if (deps.typeorm) return "TypeORM"
  if (deps.sequelize) return "Sequelize"
  if (deps.mongoose || deps.mongodb) return "Mongoose"
  if (deps.prisma) return "Prisma"
  if (deps.kysely) return "Kysely"
  return "Unknown"
}

function detectDatabase(rootDir: string, pkg: PackageJson | null): string {
  if (!pkg) return "Unknown"
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  if (deps.pg || deps["postgres-js"] || deps.postgres) return "PostgreSQL"
  if (deps.mysql2 || deps.mysql) return "MySQL"
  if (deps.sqlite3 || deps["better-sqlite3"]) return "SQLite"
  if (deps.mongoose || deps.mongodb) return "MongoDB"
  if (deps.redis || deps.ioredis) return "Redis"
  if (hasFile(rootDir, "prisma", "schema.prisma")) {
    try {
      const schema = readFileSync(join(rootDir, "prisma", "schema.prisma"), "utf8")
      const provider = schema.match(/provider\s*=\s*"(\w+)"/)
      if (provider) return provider[1] === "postgresql" ? "PostgreSQL" : provider[1]
    } catch {}
  }
  return "Unknown"
}

function detectStyling(pkg: PackageJson | null): string {
  if (!pkg) return "Unknown"
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  if (deps.tailwindcss || deps["@tailwindcss/postcss"]) return "Tailwind"
  if (deps["styled-components"]) return "styled-components"
  if (deps["@emotion/styled"]) return "Emotion"
  if (deps.sass || deps["node-sass"]) return "Sass/SCSS"
  if (deps.bootstrap) return "Bootstrap"
  return "Unknown"
}

function detectValidation(pkg: PackageJson | null): string {
  if (!pkg) return "Unknown"
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  if (deps.zod) return "Zod"
  if (deps.yup) return "Yup"
  if (deps.joi) return "Joi"
  if (deps["class-validator"]) return "class-validator"
  if (deps.valibot) return "Valibot"
  return "Unknown"
}

function detectTesting(rootDir: string, pkg: PackageJson | null): string {
  if (!pkg) return "Unknown"
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  if (deps.jest || hasFile(rootDir, "jest.config.js") || hasFile(rootDir, "jest.config.mjs")) return "Jest"
  if (deps.vitest || hasFile(rootDir, "vitest.config.ts")) return "Vitest"
  if (deps["@testing-library/react"]) return "Testing Library + Jest"
  if (deps.pytest) return "pytest"
  if (deps.mocha) return "Mocha"
  if (deps["@playwright/test"]) return "Playwright"
  return "Unknown"
}

function detectLinter(pkg: PackageJson | null): string {
  if (!pkg) return "Unknown"
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  if (deps.eslint) return "ESLint"
  if (deps.biome) return "Biome"
  if (deps.deno) return "deno lint"
  if (deps.ruff) return "Ruff"
  return "Unknown"
}

function detectPackageManager(rootDir: string): string {
  if (hasFile(rootDir, "bun.lock") || hasFile(rootDir, "bun.lockb")) return "bun"
  if (hasFile(rootDir, "pnpm-lock.yaml")) return "pnpm"
  if (hasFile(rootDir, "yarn.lock")) return "yarn"
  if (hasFile(rootDir, "package-lock.json")) return "npm"
  if (hasFile(rootDir, "go.sum") || hasFile(rootDir, "go.mod")) return "go mod"
  if (hasFile(rootDir, "Cargo.lock") || hasFile(rootDir, "Cargo.toml")) return "cargo"
  if (hasFile(rootDir, "uv.lock") || hasFile(rootDir, "pyproject.toml")) return "uv/pip"
  return "Unknown"
}

function detectTypeCheck(rootDir: string, pkg: PackageJson | null): string {
  if (!pkg) return "Unknown"
  const hasTsc = hasFile(rootDir, "tsconfig.json")
  const scripts = pkg.scripts || {}
  if (scripts.typecheck) return "npm run typecheck"
  if (scripts["type-check"]) return "npm run type-check"
  if (hasTsc) return "tsc --noEmit"
  return "Unknown"
}

function detectKeyLibraries(pkg: PackageJson | null): string[] {
  if (!pkg) return []
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
  const notable = [
    "next-auth", "jsonwebtoken", "bcryptjs", "argon2",
    "stripe", "twilio", "sendgrid", "nodemailer",
    "ioredis", "bull", "bullmq",
    "openai", "anthropic", "@anthropic-ai/sdk",
    "winston", "pino", "dotenv",
    "lodash", "date-fns", "dayjs",
    "rxjs", "zod", "drizzle-orm",
    "playwright", "@playwright/test",
    "storybook",
  ]
  return notable.filter((lib) => deps[lib])
}

function detectNamingConventions(rootDir: string): {
  files: string
  components: string
  functions: string
} {
  const srcDir = join(rootDir, "src")
  const dirs = existsSync(srcDir) ? srcDir : rootDir
  let hasKebab = false
  let hasPascal = false
  let hasCamel = false

  try {
    for (const base of walkProject(dirs, 100).map((p) => p.split("/").pop() || p)) {
      if (base.includes("-") && base.match(/^[a-z]/)) hasKebab = true
      if (base.match(/^[A-Z][a-zA-Z]*\.(ts|tsx|js|jsx)$/)) hasPascal = true
      if (base.match(/^[a-z][a-zA-Z]*\.(ts|tsx|js|jsx)$/) && !base.includes("-")) hasCamel = true
    }
  } catch {}

  return {
    files: hasKebab ? "kebab-case" : hasCamel ? "camelCase" : "default",
    components: hasPascal ? "PascalCase" : "PascalCase",
    functions: "camelCase",
  }
}

function findExampleFiles(rootDir: string, patterns: RegExp[], maxFiles = 3): string[] {
  const srcDir = join(rootDir, "src")
  const searchDir = existsSync(srcDir) ? srcDir : rootDir
  const results: string[] = []
  // Walk a bounded candidate set (100 files, node_modules pruned) rather than
  // capping the walk at maxFiles: a tiny cap can return paths that sort before
  // the file the pattern is actually looking for.
  for (const entry of walkProject(searchDir, 100)) {
    const full = join(searchDir, entry)
    try {
      const stat = statSync(full)
      if (!stat.isFile()) continue
    } catch {
      continue
    }
    if (patterns.some((p) => p.test(entry))) {
      results.push(full)
      if (results.length >= maxFiles) break
    }
  }
  return results
}

function extractApiExample(rootDir: string): string {
  const apiFiles = findExampleFiles(rootDir, [
    /route\.(ts|js)$/,
    /controller\.(ts|js)$/,
    /handler\.(ts|js)$/,
    /api\/.*\.(ts|js)$/,
  ], 1)
  if (apiFiles.length === 0) return ""
  try {
    const content = readFileSync(apiFiles[0], "utf8")
    const lines = content.split("\n").slice(0, 40).join("\n")
    return lines
  } catch {
    return ""
  }
}

function extractComponentExample(rootDir: string): string {
  const componentFiles = findExampleFiles(rootDir, [
    /^[A-Z][a-zA-Z]*\.(tsx|jsx)$/,
  ], 1)
  if (componentFiles.length === 0) return ""
  try {
    const content = readFileSync(componentFiles[0], "utf8")
    const lines = content.split("\n").slice(0, 40).join("\n")
    return lines
  } catch {
    return ""
  }
}

function detectSecurityPatterns(_rootDir: string, pkg: PackageJson | null): string[] {
  const patterns: string[] = []
  if (!pkg) return patterns
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }

  if (deps.zod || deps.yup || deps.joi) patterns.push("- Input validation with " + (deps.zod ? "Zod" : deps.yup ? "Yup" : "Joi"))
  if (deps.bcryptjs || deps.argon2 || deps.bcrypt) patterns.push("- Password hashing with " + (deps.argon2 ? "argon2" : "bcrypt"))
  if (deps.jsonwebtoken || deps["next-auth"] || deps["@auth/core"]) patterns.push("- Auth via " + (deps["next-auth"] ? "NextAuth" : deps["@auth/core"] ? "Auth.js" : "JWT"))
  if (deps.helmet) patterns.push("- Helmet for HTTP headers")
  if (deps.cors) patterns.push("- CORS configured")
  if (deps["express-rate-limit"] || deps["rate-limiter-flexible"]) patterns.push("- Rate limiting")

  if (patterns.length === 0) {
    patterns.push("- Validate all user input (never trust input)")
    patterns.push("- Use parameterized queries (no string concatenation for SQL)")
    patterns.push("- Store secrets in environment variables, never hardcode")
    patterns.push("- Use .env files for local dev, add .env to .gitignore")
  }

  return patterns
}

export function detectTechStack(rootDir: string): TechStack {
  const pkg = readPackageJson(rootDir)
  return {
    language: detectLanguage(rootDir, pkg),
    framework: detectFramework(rootDir, pkg),
    orm: detectOrm(rootDir, pkg),
    database: detectDatabase(rootDir, pkg),
    styling: detectStyling(pkg),
    validation: detectValidation(pkg),
    testing: detectTesting(rootDir, pkg),
    linter: detectLinter(pkg),
    typeCheck: detectTypeCheck(rootDir, pkg),
    packageManager: detectPackageManager(rootDir),
    keyLibraries: detectKeyLibraries(pkg),
  }
}

function buildProjectMd(stack: TechStack, now: string): string {
  const libs = stack.keyLibraries.length > 0
    ? stack.keyLibraries.map((l) => `- ${l}`).join("\n")
    : "- (auto-detected on next run)"
  return `# Project Patterns
> Auto-generated: ${now}
> MVI: keep under 200 lines. Edit manually to override.

## Tech Stack
- Language: ${stack.language}
- Framework: ${stack.framework}
- ORM: ${stack.orm}
- Database: ${stack.database}
- Styling: ${stack.styling}
- Validation: ${stack.validation}
- Testing: ${stack.testing}
- Linter: ${stack.linter}
- Type check: ${stack.typeCheck}
- Package manager: ${stack.packageManager}

## Architecture
- Follow existing project structure (auto-detected)
- SOLID + Clean Architecture principles
- Dependency inversion: domain has no framework coupling
- Surgical changes: smallest correct diff

## Key Libraries
${libs}
`
}

function buildConventionsMd(rootDir: string, now: string): string {
  const naming = detectNamingConventions(rootDir)
  const stack = detectTechStack(rootDir)
  const standards: string[] = []
  if (stack.language === "TypeScript") {
    standards.push("- TypeScript strict mode")
    standards.push("- No 'any' types")
    standards.push("- Explicit return types on public APIs")
  }
  standards.push("- Prefer early returns over deep nesting")
  standards.push("- No magic numbers — extract constants")
  standards.push("- Co-locate tests next to source files")
  standards.push("- One component/module per file")

  return `# Coding Conventions
> Auto-generated: ${now}
> MVI: keep under 200 lines. Edit manually to override.

## Naming
- Files: ${naming.files}
- Components: ${naming.components}
- Functions: ${naming.functions}
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase

## Code Standards
${standards.join("\n")}

## File Organization
- Follow existing project directory structure
- Index files (index.ts) for barrel exports
- Test files: *.test.ts next to source
`
}

function buildSecurityMd(rootDir: string, now: string): string {
  const pkg = readPackageJson(rootDir)
  const patterns = detectSecurityPatterns(rootDir, pkg)
  return `# Security Requirements
> Auto-generated: ${now}
> MVI: keep under 200 lines. Edit manually to override.

## Detected Patterns
${patterns.join("\n")}

## Universal Rules
- Never trust user input — validate everything
- Parameterized queries only (no SQL string concatenation)
- Secrets in environment variables, never in code
- .env files in .gitignore
- Auth checks on every protected route
- Rate limit auth endpoints
`
}

function buildExamplesMd(rootDir: string, now: string): string {
  const apiExample = extractApiExample(rootDir)
  const componentExample = extractComponentExample(rootDir)

  const apiSection = apiExample
    ? `## API Endpoint Pattern (from your codebase)\n\`\`\`typescript\n${apiExample}\n\`\`\``
    : `## API Endpoint Pattern (template — no example found in codebase)\n\`\`\`typescript\n// Follow your framework's convention\n// Validate input, handle errors, return proper status codes\n\`\`\``

  const componentSection = componentExample
    ? `## Component Pattern (from your codebase)\n\`\`\`typescript\n${componentExample}\n\`\`\``
    : `## Component Pattern (template — no example found in codebase)\n\`\`\`typescript\n// Follow your framework's component convention\n\`\`\``

  return `# Code Examples
> Auto-generated: ${now}
> MVI: keep examples under 80 lines each.

${apiSection}

${componentSection}
`
}

export function generateContext(rootDir: string, force = false): { generated: string[]; skipped: string[] } {
  const dir = contextDir(rootDir)
  ensureContextDir(rootDir)
  const now = new Date().toISOString()
  const stack = detectTechStack(rootDir)

  const files: Record<ContextFile, string> = {
    "project.md": buildProjectMd(stack, now),
    "conventions.md": buildConventionsMd(rootDir, now),
    "security.md": buildSecurityMd(rootDir, now),
    "examples.md": buildExamplesMd(rootDir, now),
  }

  const generated: string[] = []
  const skipped: string[] = []

  for (const [name, content] of Object.entries(files) as [ContextFile, string][]) {
    const path = join(dir, name)
    if (existsSync(path) && !force) {
      skipped.push(name)
      continue
    }
    writeFileSync(path, content)
    generated.push(name)
  }

  return { generated, skipped }
}

export function autoGenerateContextIfMissing(rootDir: string): boolean {
  const summary = readContextSummary(rootDir)
  if (summary.hasContext) return false
  const result = generateContext(rootDir, false)
  return result.generated.length > 0
}

function dirTree(rootDir: string, dir: string, depth = 0, maxDepth = 4): string {
  if (depth > maxDepth) return ""
  const absPath = join(rootDir, dir)
  let entries: string[]
  try {
    entries = readdirSync(absPath)
  } catch {
    return ""
  }
  const indent = "  ".repeat(depth)
  let result = ""
  const dirs: string[] = []
  const files: string[] = []
  for (const entry of entries.sort()) {
    if (entry.startsWith(".") || entry === "node_modules" || entry === "dist" || entry === "coverage" || entry === ".git") continue
    const full = join(absPath, entry)
    try {
      if (statSync(full).isDirectory()) dirs.push(entry)
      else files.push(entry)
    } catch {}
  }
  for (const d of dirs) {
    result += `${indent}${d}/\n`
    result += dirTree(rootDir, join(dir, d), depth + 1, maxDepth)
  }
  for (const f of files.slice(0, 8)) {
    result += `${indent}${f}\n`
  }
  if (files.length > 8) result += `${indent}... (+${files.length - 8} more)\n`
  return result
}

export function buildAtlas(rootDir: string): string {
  const pkg = readPackageJson(rootDir)
  const name = pkg?.name || basename(rootDir)
  return [
    `# Architecture Atlas: ${name}`,
    `> Auto-generated. Edit manually to override. Update when project structure changes significantly.`,
    "",
    "## Directory Tree",
    "```",
    dirTree(rootDir, ".").trim(),
    "```",
    "",
    "## Key Files",
    "- package.json" + (pkg ? ` (${(pkg as Record<string, unknown>).description || "no description"})` : ""),
    "- tsconfig.json" + (existsSync(join(rootDir, "tsconfig.json")) ? " (TypeScript config)" : " (not found)"),
    "- README.md" + (existsSync(join(rootDir, "README.md")) ? " (project docs)" : " (not found)"),
    "",
    "## Tech Stack",
    ...Object.entries(detectTechStack(rootDir)).map(([k, v]) => `- ${k}: ${v}`),
    "",
  ].join("\n")
}

export function ensureAtlas(rootDir: string): boolean {
  const atlasPath = join(contextDir(rootDir), "atlas.md")
  if (existsSync(atlasPath)) return false
  const atlas = buildAtlas(rootDir)
  writeFileSync(atlasPath, atlas)
  return true
}
