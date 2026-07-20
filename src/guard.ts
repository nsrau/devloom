import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { readWorktreeSummary } from "./worktree.js"
import { contextSummaryString } from "./context.js"
import { readLoopStateSummary } from "./loop.js"
import { readConstraints, buildConstraintsGuard } from "./constraints.js"

function constraintsSummary(rootDir: string): string {
  const loop = readLoopStateSummary(rootDir)
  if (loop.includes("loop=inactive")) return ""
  const constraints = readConstraints(rootDir)
  return buildConstraintsGuard(constraints)
}

export const ORCHESTRATOR_AGENT = "devloom-orchestrator"

const WRITE_TOOLS = new Set(["write", "edit", "patch"])
const DEVLOOM_STATE_DIR = ".opencode/devloom/"

export const DEVLOOM_AGENTS = [
  { name: "devloom-orchestrator", role: "Strategic coordinator" },
  { name: "devloom-planner", role: "Requirements, specs, architecture" },
  { name: "devloom-developer", role: "Implementation, code, fixes" },
  { name: "devloom-qa", role: "Verification, review, regression" },
  { name: "devloom-verifier", role: "Runtime checks, routes, a11y, API" },
  { name: "devloom-security", role: "Security audit, CRUD review" },
  { name: "devloom-documenter", role: "Documentation, README" },
  { name: "devloom-vision", role: "Image/screenshot analysis" },
]

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T
  } catch {
    return fallback
  }
}

export function readStateSummary(rootDir: string): string {
  const projectRoot = join(rootDir, ".opencode", "devloom", "project")
  const state = readJson<{ phase?: string; ticket?: string; next?: string; sessions?: Record<string, string>; degraded?: boolean; loopCounts?: Record<string, number> }>(
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
  const wt = readWorktreeSummary(rootDir)
  const loopSummary = readLoopStateSummary(rootDir)
  const ctx = contextSummaryString(rootDir)
  const sessCount = state.sessions ? Object.keys(state.sessions).length : 0
  const degraded = state.degraded ? " degraded" : ""
  const atlas = existsSync(join(rootDir, ".opencode", "devloom", "context", "atlas.md")) ? " atlas" : ""
  const loopDetect = detectLoopState(state)
  const parts = [`phase=${state.phase} ticket=${state.ticket || "-"} next=${state.next || "-"} doing=${doing} backlog=${backlog} sessions=${sessCount}${degraded}${atlas} ${wt} ${loopSummary} ${ctx}${loopDetect}`]
  const constrGuard = constraintsSummary(rootDir)
  if (constrGuard) parts.push(constrGuard)
  return parts.join(" ")
}

function detectLoopState(state: { loopCounts?: Record<string, number>; ticket?: string }): string {
  if (!state.loopCounts || Object.keys(state.loopCounts).length === 0) return ""
  const warnings: string[] = []
  for (const [agent, count] of Object.entries(state.loopCounts)) {
    if (count >= 3) {
      warnings.push(`ALERT:${agent}=${count}x(retry limit reached)`)
    } else if (count >= 2) {
      warnings.push(`WARN:${agent}=${count}x`)
    }
  }
  if (warnings.length === 0) return ""
  return ` loop_risk=[${warnings.join(";")}]`
}

const COMPLIANCE_REQUIREMENTS = [
  "COMPLIANCE: you MUST follow the protocol and skill files declared in your LOAD directive — they define your operating rules, output format, and gates.",
  "COMPLIANCE: you MUST NOT skip, abbreviate, or ignore any RULE in your LOADed files. Every rule is mandatory.",
  "COMPLIANCE: you MUST complete all required gates (build, lint, test, review) before emitting your OUT signal.",
  "COMPLIANCE: you MUST use your skill file — it defines the engineering standards and workflow for your role.",
]

export function buildGuardText(agent: string | undefined, stateSummary: string): string | null {
  if (agent && agent.startsWith("devloom-") && agent !== ORCHESTRATOR_AGENT) {
    return [
      `[devloom-guard] ${agent}`,
      ...COMPLIANCE_REQUIREMENTS,
      `DevLoom state: ${stateSummary}`,
    ].join(" ")
  }
  if (agent === ORCHESTRATOR_AGENT) {
    const loopWarning = stateSummary.includes("loop_risk=")
      ? " LOOP DETECTED — reduce delegation depth, break task into smaller pieces, or report BLOCKED."
      : ""
    return [
      "[devloom-guard] Orchestrator protocol, every turn:",
      ...COMPLIANCE_REQUIREMENTS,
      "COMPLIANCE: verify every sub-agent output against the protocol gates — reject incomplete or non-compliant results.",
      "1) read board+state 2) resume pending phase first 3) new prompt → triage intent, pick minimal chain (never full pipeline by default)",
      "4) delegate ALL phase work via task() — never write code/diffs yourself, never self-delegate",
      "5) persist board+state after each phase 6) end only with task() issued, BLOCKED+reason, or DEVLOOM_DONE.",
      "ANTI-LOOP: max 2 retries per agent per ticket. After 2 failures → BLOCKED + report. Never delegate to same agent 3x on same ticket.",
      "REDIRECT: if sub-agent calls task() instead of completing work → STOP, report BLOCKED, delegation chain detected." + loopWarning,
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
