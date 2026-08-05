import { readFileSync, existsSync } from "node:fs"
import { join, normalize } from "node:path"
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

const STATE_SUMMARY_TTL_MS = 2_000
let stateCache: { rootDir: string; at: number; value: string } | null = null

/** Test hook — drops the memoized state summary. */
export function resetStateSummaryCache(): void {
  stateCache = null
}

/**
 * Memoized for {@link STATE_SUMMARY_TTL_MS}: this runs on every `chat.message`
 * AND every `experimental.chat.system.transform`, and each uncached call spawns
 * a synchronous `git` per worktree plus a dozen file reads.
 */
export function readStateSummary(rootDir: string): string {
  const now = Date.now()
  if (stateCache && stateCache.rootDir === rootDir && now - stateCache.at < STATE_SUMMARY_TTL_MS) {
    return stateCache.value
  }
  const value = computeStateSummary(rootDir)
  stateCache = { rootDir, at: now, value }
  return value
}

function computeStateSummary(rootDir: string): string {
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

/**
 * True when `path` lands inside `.opencode/devloom/`. Normalizes first so
 * `.opencode/devloom/../../src/app.ts` is correctly seen as an escape, and so
 * the exact `.opencode/devloom` root is still allowed (the trailing-slash
 * `.includes` alone would reject it). Backslash separators are folded to `/`
 * both before (input) and after (Windows `normalize`) normalization.
 */
function isDevloomStatePath(path: string): boolean {
  if (!path) return false
  const normalized = normalize(path.replace(/\\/g, "/")).replace(/\\/g, "/")
  // `includes` (with trailing slash) covers anything beneath the root;
  // `endsWith` covers the root itself — e.g. `/repo/.opencode/devloom`.
  return normalized.includes(DEVLOOM_STATE_DIR) || normalized.endsWith(DEVLOOM_STATE_DIR.slice(0, -1))
}

/** Mutators the orchestrator has no legitimate use for — always blocked. */
const BASH_FORBIDDEN = /\b(?:sed\s+(?:-\S+\s+)*-\S*i|perl\s+(?:-\S+\s+)*-\S*i|truncate|dd)\b/

/** Targets that are fd/device sinks, never project files. */
const IGNORED_TARGETS = new Set([
  "/dev/null",
  "/dev/zero",
  "/dev/stdin",
  "/dev/stdout",
  "/dev/stderr",
  "/dev/tty",
])

type ShellToken =
  | { kind: "word"; value: string }
  | { kind: "op"; op: string }
  | { kind: "sub"; code: string }

const WORD_STOP = " \t\r\n><|&;()'\"`\\#"

/**
 * Lightweight, quote-aware shell tokenizer. Splits a command into words,
 * operators (`>`, `>>`, `<<`, `>&`, `|`, `&&`, ...), and command-substitution
 * bodies (`$(...)`, backticks) that are re-scanned recursively. Unlike the old
 * regexes it respects single/double quotes and backslash escapes, and it skips
 * heredoc bodies between the `<<DELIM` and the closing delimiter line.
 *
 * Known limit (unchanged): it does not execute the command, so writes hidden in
 * `node -e "writeFileSync(...)"` or an aliased shell function stay invisible.
 */
function tokenizeShell(command: string): ShellToken[] {
  const toks: ShellToken[] = []
  const n = command.length
  let i = 0
  let heredocPending = false
  let heredocDelim = ""
  let heredocAwaitNewline = false
  let inHeredoc = false

  const pushWord = (value: string): void => {
    if (heredocPending) {
      heredocDelim = value
      heredocPending = false
      // The heredoc body starts at the first newline after the delimiter; other
      // tokens on the same line (e.g. `cat <<EOF >> out`) are still real
      // command tokens that must be scanned before the body is skipped.
      heredocAwaitNewline = true
      return
    }
    toks.push({ kind: "word", value })
  }

  while (i < n) {
    if (inHeredoc) {
      const nl = command.indexOf("\n", i)
      const lineEnd = nl === -1 ? n : nl
      if (command.slice(i, lineEnd).trim() === heredocDelim) inHeredoc = false
      i = nl === -1 ? n : nl + 1
      continue
    }
    const c = command[i]
    if (c === "\n" || c === "\r") {
      if (heredocAwaitNewline) {
        heredocAwaitNewline = false
        inHeredoc = true
      }
      i++
      continue
    }
    if (c === " " || c === "\t") {
      i++
      continue
    }
    if (c === "#") {
      while (i < n && command[i] !== "\n") i++
      continue
    }
    if (c === ">" || c === "<") {
      const next = command[i + 1]
      if (next === c) {
        toks.push({ kind: "op", op: c + c })
        if (c === "<") heredocPending = true
        i += 2
      } else if (next === "&") {
        toks.push({ kind: "op", op: c + "&" })
        i += 2
      } else {
        toks.push({ kind: "op", op: c })
        i++
      }
      continue
    }
    if (c === "|" || c === "&") {
      toks.push({ kind: "op", op: command[i + 1] === c ? c + c : c })
      i += command[i + 1] === c ? 2 : 1
      continue
    }
    if (c === ";" || c === "(" || c === ")") {
      toks.push({ kind: "op", op: c })
      i++
      continue
    }
    if (c === "'") {
      const end = command.indexOf("'", i + 1)
      pushWord(end === -1 ? command.slice(i + 1) : command.slice(i + 1, end))
      i = end === -1 ? n : end + 1
      continue
    }
    if (c === '"') {
      let j = i + 1
      let value = ""
      while (j < n && command[j] !== '"') {
        if (command[j] === "\\" && j + 1 < n) {
          value += command[j + 1]
          j += 2
        } else {
          value += command[j]
          j++
        }
      }
      pushWord(value)
      i = j < n ? j + 1 : n
      continue
    }
    if (c === "\\") {
      pushWord(i + 1 < n ? command[i + 1] : "")
      i += 2
      continue
    }
    if (c === "$" && command[i + 1] === "(") {
      let depth = 1
      let j = i + 2
      while (j < n && depth > 0) {
        if (command[j] === "(") depth++
        else if (command[j] === ")") depth--
        j++
      }
      toks.push({ kind: "sub", code: command.slice(i + 2, j - 1) })
      i = j
      continue
    }
    if (c === "`") {
      const end = command.indexOf("`", i + 1)
      toks.push({ kind: "sub", code: command.slice(i + 1, end === -1 ? n : end) })
      i = end === -1 ? n : end + 1
      continue
    }
    let j = i
    while (j < n && !WORD_STOP.includes(command[j])) j++
    pushWord(command.slice(i, j))
    i = j
  }
  return toks
}

/**
 * Write targets a bash command would touch.
 *
 * Quote-aware tokenizer (not a full shell parser): it catches redirection
 * (`>`, `>>`), `tee` outputs, `mv`/`cp`/`install` destinations, and `rm`
 * arguments, recurses into `$(...)`/backtick substitutions and `sh -c`/`bash -c`
 * code strings. It cannot see through `node -e "writeFileSync(...)"` or an
 * aliased command.
 */
const SHELL_COMMANDS = new Set(["bash", "sh", "zsh", "ksh", "dash", "fish", "/bin/bash", "/bin/sh", "env bash"])

export function bashWriteTargets(command: string): string[] {
  const targets = new Set<string>()
  let pendingRedirect = false
  let fdDupTarget = false
  let segment: string[] = []
  const segments: string[][] = [segment]

  const visit = (code: string, depth = 0): void => {
    if (depth > 5) return
    for (const t of tokenizeShell(code)) {
      if (t.kind === "sub") {
        pendingRedirect = false
        visit(t.code, depth + 1)
        continue
      }
      if (t.kind === "op") {
        if (t.op === ">" || t.op === ">>") {
          pendingRedirect = true
        } else {
          pendingRedirect = false
        }
        // `2>&1` / `2>err.log`: a bare integer immediately before a redirect is
        // an fd number, not a file argument.
        if (/^\d+$/.test(segment[segment.length - 1] ?? "")) segment.pop()
        if (t.op === ">&" || t.op === "<&") fdDupTarget = true
        if (t.op === "|" || t.op === ";" || t.op === "&&" || t.op === "||" || t.op === "(") {
          segment = []
          segments.push(segment)
          fdDupTarget = false
        }
        continue
      }
      if (pendingRedirect) {
        if (!IGNORED_TARGETS.has(t.value)) targets.add(t.value)
        pendingRedirect = false
        fdDupTarget = false
        continue
      }
      if (fdDupTarget) {
        fdDupTarget = false
        continue
      }
      segment.push(t.value)
    }
  }

  visit(command)

  // `sh -c 'echo x > f'` hides the write inside a quoted code string.
  for (const seg of segments) {
    if (seg.length >= 3 && SHELL_COMMANDS.has(seg[0]) && seg[1] === "-c") {
      visit(seg.slice(2).join(" "), 1)
    }
  }

  for (const seg of segments) {
    if (seg.length === 0) continue
    const cmd = seg[0]
    const args = seg.slice(1)
    if (cmd === "tee") {
      for (const arg of args) if (!arg.startsWith("-") && !IGNORED_TARGETS.has(arg)) targets.add(arg)
    } else if (cmd === "rm" || cmd === "rmdir") {
      for (const arg of args) if (!arg.startsWith("-") && !IGNORED_TARGETS.has(arg)) targets.add(arg)
    } else if (cmd === "mv" || cmd === "cp" || cmd === "install") {
      const dest = args[args.length - 1]
      if (dest && !dest.startsWith("-") && !IGNORED_TARGETS.has(dest)) targets.add(dest)
    }
  }

  return [...targets]
}

export function isBlockedOrchestratorCall(tool: string, args: unknown): boolean {
  if (tool === "bash") {
    const command = typeof (args as { command?: unknown })?.command === "string"
      ? (args as { command: string }).command
      : ""
    if (!command) return false
    if (BASH_FORBIDDEN.test(command)) return true
    return bashWriteTargets(command).some((target) => !isDevloomStatePath(target))
  }
  if (!WRITE_TOOLS.has(tool)) return false
  const filePath = typeof (args as { filePath?: unknown })?.filePath === "string"
    ? (args as { filePath: string }).filePath
    : ""
  return !isDevloomStatePath(filePath)
}
