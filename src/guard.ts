import { readFileSync } from "node:fs"
import { join } from "node:path"

export const ORCHESTRATOR_AGENT = "devloom-orchestrator"

const WRITE_TOOLS = new Set(["write", "edit", "patch"])
const DEVLOOM_STATE_DIR = ".opencode/devloom/"

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T
  } catch {
    return fallback
  }
}

export function readStateSummary(rootDir: string): string {
  const projectRoot = join(rootDir, ".opencode", "devloom", "project")
  const state = readJson<{ phase?: string; ticket?: string; next?: string }>(
    join(projectRoot, "state.json"),
    {}
  )
  const board = readJson<{ cols?: { doing?: string[]; backlog?: string[] } }>(
    join(projectRoot, "board.json"),
    {}
  )
  if (!state.phase) return "unbootstrapped"
  const doing = Array.isArray(board.cols?.doing) ? board.cols.doing.length : 0
  const backlog = Array.isArray(board.cols?.backlog) ? board.cols.backlog.length : 0
  return `phase=${state.phase} ticket=${state.ticket || "-"} next=${state.next || "-"} doing=${doing} backlog=${backlog}`
}

export function buildGuardText(agent: string | undefined, stateSummary: string): string | null {
  if (agent && agent.startsWith("devloom-") && agent !== ORCHESTRATOR_AGENT) {
    return null
  }
  if (agent === ORCHESTRATOR_AGENT) {
    return [
      "[devloom-guard] Orchestrator protocol, every turn:",
      "1) read board+state 2) resume pending phase first 3) new prompt → triage intent, pick minimal chain (never full pipeline by default)",
      "4) delegate ALL phase work via task() — never write code/diffs yourself, never self-delegate",
      "5) persist board+state after each phase 6) end only with task() issued, BLOCKED+reason, or DEVLOOM_DONE.",
      `State: ${stateSummary}`,
    ].join(" ")
  }
  return [
    "[devloom-guard] Routing rule: code work (build/fix/refactor/add/test/migrate/deploy/document)",
    '→ task(subagent:"devloom-orchestrator", description:"...", prompt:"<request>").',
    "Pure questions or single-line tweaks → answer directly.",
    `DevLoom state: ${stateSummary}`,
  ].join(" ")
}

export const ORCH_TOOL_OUTPUT_LIMIT = 12_000

export function clampToolOutput(text: string, limit = ORCH_TOOL_OUTPUT_LIMIT): string {
  if (text.length <= limit) return text
  const head = text.slice(0, Math.floor(limit * 0.7))
  const tail = text.slice(-Math.floor(limit * 0.2))
  return [
    head,
    `\n[devloom-guard] output truncated (${text.length} chars). Full detail belongs in .opencode/devloom/ artifacts, not chat context.\n`,
    tail,
  ].join("")
}

export function isBlockedOrchestratorCall(tool: string, args: unknown): boolean {
  if (!WRITE_TOOLS.has(tool)) return false
  const filePath = typeof (args as { filePath?: unknown })?.filePath === "string"
    ? ((args as { filePath: string }).filePath).replace(/\\/g, "/")
    : ""
  return !filePath.includes(DEVLOOM_STATE_DIR)
}
