import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { DEFAULT_CONSTRAINTS } from "./constraints.js"

export type LoopConfig = {
  pattern: string
  cadence: string
  level: "L1" | "L2" | "L3"
  paused: boolean
  mode?: "recurring" | "until-done"
  progress?: UntilDoneProgress
}

export type RunLogEntry = {
  timestamp: string
  pattern: string
  agentsUsed: string[]
  outcome: "success" | "failure" | "partial"
  tokenCost: number
  durationMs: number
  error?: string
}

export type Budget = {
  dailyLimit: number
  spent: number
  resetAt: string
}

export type IssueCategory = "ui" | "functional" | "missing-action" | "broken-action" | "api" | "state"
export type IssueSeverity = "critical" | "high" | "medium" | "low"

export type UntilDoneItem = {
  id: string
  status: "pending" | "in-progress" | "done" | "verified"
  category?: IssueCategory
  severity?: IssueSeverity
  data?: Record<string, unknown>
}

export type UntilDoneProgress = {
  items: UntilDoneItem[]
  completionCondition: string
  total: number
  done: number
  verified: number
}

const DEFAULT_CONFIG: LoopConfig = { pattern: "", cadence: "0 0 * * *", level: "L1", paused: false, mode: "recurring" }

function nextMidnightISO(): string {
  const now = new Date()
  const mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  return mid.toISOString()
}

function defaultBudget(): Budget {
  return { dailyLimit: 500000, spent: 0, resetAt: nextMidnightISO() }
}

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T
  } catch {
    return fallback
  }
}

function writeJson(path: string, data: unknown): void {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n")
}

export function loopWorkspaceDir(rootDir: string): string {
  return join(rootDir, ".opencode", "devloom", "loop")
}

export function readLoopConfig(rootDir: string): LoopConfig {
  const path = join(loopWorkspaceDir(rootDir), "loop-config.json")
  return readJson(path, { ...DEFAULT_CONFIG })
}

export function writeLoopConfig(rootDir: string, config: LoopConfig): void {
  const path = join(loopWorkspaceDir(rootDir), "loop-config.json")
  writeJson(path, config)
}

export function readRunLog(rootDir: string, limit?: number): RunLogEntry[] {
  const path = join(loopWorkspaceDir(rootDir), "run-log.json")
  const entries = readJson<RunLogEntry[]>(path, [])
  if (limit && limit > 0) {
    return entries.slice(-limit)
  }
  return entries
}

export function appendRunLog(rootDir: string, entry: RunLogEntry): void {
  const path = join(loopWorkspaceDir(rootDir), "run-log.json")
  const entries = readJson<RunLogEntry[]>(path, [])
  entries.push(entry)
  writeJson(path, entries)
}

export function readBudget(rootDir: string): Budget {
  const path = join(loopWorkspaceDir(rootDir), "budget.json")
  return readJson(path, defaultBudget())
}

export function writeBudget(rootDir: string, budget: Budget): void {
  const path = join(loopWorkspaceDir(rootDir), "budget.json")
  writeJson(path, budget)
}

export function checkBudget(rootDir: string): { allowed: boolean; remaining: number; resetAt: string } {
  const budget = readBudget(rootDir)
  const now = new Date()
  const resetTime = new Date(budget.resetAt)
  let effective: Budget
  if (now >= resetTime) {
    effective = defaultBudget()
    writeBudget(rootDir, effective)
  } else {
    effective = budget
  }
  const remaining = Math.max(0, effective.dailyLimit - effective.spent)
  return { allowed: remaining > 0, remaining, resetAt: effective.resetAt }
}

export function recordSpend(rootDir: string, tokens: number): void {
  const budget = readBudget(rootDir)
  const now = new Date()
  const resetTime = new Date(budget.resetAt)
  let effective: Budget
  if (now >= resetTime) {
    effective = { ...defaultBudget(), spent: tokens }
  } else {
    effective = { ...budget, spent: budget.spent + tokens }
  }
  writeBudget(rootDir, effective)
}

export function shouldPause(rootDir: string): boolean {
  const check = checkBudget(rootDir)
  if (!check.allowed) {
    const config = readLoopConfig(rootDir)
    if (!config.paused) {
      config.paused = true
      writeLoopConfig(rootDir, config)
    }
    return true
  }
  return false
}

export function ensureLoopWorkspace(rootDir: string): void {
  const dir = loopWorkspaceDir(rootDir)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  const configPath = join(dir, "loop-config.json")
  if (!existsSync(configPath)) writeJson(configPath, { ...DEFAULT_CONFIG })

  const runLogPath = join(dir, "run-log.json")
  if (!existsSync(runLogPath)) writeJson(runLogPath, [])

  const budgetPath = join(dir, "budget.json")
  if (!existsSync(budgetPath)) writeJson(budgetPath, defaultBudget())

  const constraintsPath = join(dir, "loop-constraints.md")
  if (!existsSync(constraintsPath)) writeFileSync(constraintsPath, DEFAULT_CONSTRAINTS)
}

export function progressFilePath(rootDir: string): string {
  return join(loopWorkspaceDir(rootDir), "progress.json")
}

export function readProgress(rootDir: string): UntilDoneProgress | null {
  return readJson<UntilDoneProgress | null>(progressFilePath(rootDir), null)
}

export function writeProgress(rootDir: string, progress: UntilDoneProgress): void {
  writeJson(progressFilePath(rootDir), progress)
}

export function initUntilDoneProgress(items: UntilDoneItem[], condition: string): UntilDoneProgress {
  const done = items.filter((i) => i.status === "done" || i.status === "verified").length
  const verified = items.filter((i) => i.status === "verified").length
  return { items, completionCondition: condition, total: items.length, done, verified }
}

export function updateProgressItem(progress: UntilDoneProgress, id: string, status: UntilDoneItem["status"]): UntilDoneProgress {
  const item = progress.items.find((i) => i.id === id)
  if (item) item.status = status
  progress.done = progress.items.filter((i) => i.status === "done" || i.status === "verified").length
  progress.verified = progress.items.filter((i) => i.status === "verified").length
  return progress
}

export function checkCompletionCondition(progress: UntilDoneProgress): boolean {
  return progress.items.every((i) => i.status === "verified")
}

export function progressByCategory(progress: UntilDoneProgress): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const item of progress.items) {
    const cat = item.category || "un categorized"
    counts[cat] = (counts[cat] || 0) + 1
  }
  return counts
}

export function readLoopStateSummary(rootDir: string): string {
  const config = readLoopConfig(rootDir)
  if (!config.pattern) return "loop=inactive"
  const entries = readRunLog(rootDir, 1)
  const lastRun = entries.length > 0 ? entries[entries.length - 1].timestamp : ""
  const mode = config.mode === "until-done" ? " until-done" : ""
  const progress = config.mode === "until-done" && config.progress
    ? ` verified=${config.progress.verified}/${config.progress.total}`
    : ""
  return `loop=${config.pattern}${mode} lastRun=${lastRun || "never"} paused=${config.paused}${progress}`
}
