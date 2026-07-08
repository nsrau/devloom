import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { ensureLoopWorkspace } from "./loop.js"

type ProjectState = {
  v: number
  phase: string
  prompt: string
  ticket: string
  next: string
  updatedAt: string
  notes: string[]
}

type ProjectBoard = {
  v: number
  tracker: "local" | "github"
  active: string
  cols: {
    backlog: string[]
    ready: string[]
    doing: string[]
    review: string[]
    blocked: string[]
    done: string[]
  }
  updatedAt: string
}

type ProjectConfig = {
  v: number
  lang: "en"
  tracker: "local" | "github"
  gh: {
    enabled: boolean
    owner: string
    repo: string
    project: string
  }
  rules: {
    flow: string[]
    tests: "required"
    regression: "required"
    queue: "single"
    docs: "official"
    delegation: "required"
    skills: "required"
    memory: "load"
    save: "always"
    promptTask: "append-last"
  }
}

const PROJECT_DIRS = ["stories", "tasks", "bugs", "decisions", "reports"] as const
const WORKSPACE_README = [
  "# DevLoom Project Workspace",
  "All artifacts in this workspace must be written in English.",
  "AI-only state files use minified JSON to reduce token usage.",
  "Every new /devloom prompt must be appended as the last task in project/tasks/TODO.md before execution continues.",
  "Default workflow: load state, inspect memory, use relevant skills, delegate to subagents, keep tickets/todos/plan updated, and save state at every phase boundary.",
  "",
].join("\n")

function ensureDir(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true })
}

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T
  } catch {
    return fallback
  }
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function normalizeTracker(value: unknown): "local" | "github" {
  return value === "github" ? "github" : "local"
}

function normalizeConfig(value: unknown): ProjectConfig {
  const cfg = typeof value === "object" && value ? value as Partial<ProjectConfig> : {}
  return {
    v: 1,
    lang: "en",
    tracker: normalizeTracker(cfg.tracker),
    gh: {
      enabled: Boolean(cfg.gh?.enabled),
      owner: typeof cfg.gh?.owner === "string" ? cfg.gh.owner : "",
      repo: typeof cfg.gh?.repo === "string" ? cfg.gh.repo : "",
      project: typeof cfg.gh?.project === "string" ? cfg.gh.project : "",
    },
    rules: {
      flow: ["analysis", "documentation", "implementation", "verification", "regression", "done"],
      tests: "required",
      regression: "required",
      queue: "single",
      docs: "official",
      delegation: "required",
      skills: "required",
      memory: "load",
      save: "always",
      promptTask: "append-last",
    },
  }
}

function normalizeBoard(value: unknown, tracker: ProjectConfig["tracker"], now: string): ProjectBoard {
  const board = typeof value === "object" && value ? value as Partial<ProjectBoard> : {}
  const active = typeof board.active === "string" ? board.active : ""

  return {
    v: 1,
    tracker,
    active,
    cols: {
      backlog: normalizeStringArray(board.cols?.backlog),
      ready: normalizeStringArray(board.cols?.ready),
      doing: normalizeStringArray(board.cols?.doing).slice(0, 1),
      review: normalizeStringArray(board.cols?.review),
      blocked: normalizeStringArray(board.cols?.blocked),
      done: normalizeStringArray(board.cols?.done),
    },
    updatedAt: now,
  }
}

function normalizeState(value: unknown, board: ProjectBoard, now: string): ProjectState {
  const state = typeof value === "object" && value ? value as Partial<ProjectState> : {}
  return {
    v: 1,
    phase: typeof state.phase === "string" ? state.phase : "idle",
    prompt: typeof state.prompt === "string" ? state.prompt : "",
    ticket: typeof state.ticket === "string" ? state.ticket : board.active,
    next: typeof state.next === "string" ? state.next : "analysis",
    updatedAt: now,
    notes: normalizeStringArray(state.notes),
  }
}

export function ensureProjectWorkspace(rootDir: string) {
  const projectRoot = join(rootDir, ".opencode", "devloom", "project")
  const now = new Date().toISOString()

  ensureDir(projectRoot)
  for (const dir of PROJECT_DIRS) ensureDir(join(projectRoot, dir))

  const configPath = join(projectRoot, "config.json")
  const boardPath = join(projectRoot, "board.json")
  const statePath = join(projectRoot, "state.json")
  const readmePath = join(projectRoot, "README.md")

  const config = normalizeConfig(readJson(configPath, {}))
  const board = normalizeBoard(readJson(boardPath, {}), config.tracker, now)
  const state = normalizeState(readJson(statePath, {}), board, now)

  writeFileSync(readmePath, WORKSPACE_README)
  writeFileSync(configPath, JSON.stringify(config))
  writeFileSync(boardPath, JSON.stringify(board))
  writeFileSync(statePath, JSON.stringify(state))

  ensureLoopWorkspace(rootDir)

  return {
    config,
    board,
    state,
    projectRoot,
  }
}
