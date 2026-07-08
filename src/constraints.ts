import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export const DEFAULT_CONSTRAINTS = `# Loop Constraints
> Auto-generated. Edit to add binding rules.

## Rules
1. Run tests before any commit
2. Never push without human review on denylisted paths
3. Pause if daily token budget exceeded
4. L1 level: report-only, no source code edits
5. All loop agents must log outcomes to run-log.json
`

export function constraintsFilePath(rootDir: string): string {
  return join(rootDir, ".opencode", "devloom", "loop", "loop-constraints.md")
}

export function readConstraints(rootDir: string): string {
  const path = constraintsFilePath(rootDir)
  if (!existsSync(path)) return DEFAULT_CONSTRAINTS
  try {
    const content = readFileSync(path, "utf8")
    if (content.trim().length === 0) return DEFAULT_CONSTRAINTS
    return content
  } catch {
    return DEFAULT_CONSTRAINTS
  }
}

export function buildConstraintsGuard(constraints: string): string {
  const rules: string[] = []
  for (const line of constraints.split("\n")) {
    const trimmed = line.trim()
    if (/^\d+\.\s/.test(trimmed)) {
      rules.push(trimmed)
    }
    if (rules.length >= 3) break
  }
  if (rules.length === 0) return ""
  const summary = rules.map((r) => r.replace(/^\d+\.\s*/, "")).join("; ")
  return `[loop-constraints] Rules: ${summary}`
}
