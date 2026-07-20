import { env } from "node:process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { Hooks, PluginInput } from "@opencode-ai/plugin"
import { ensureProjectWorkspace } from "./bootstrap.js"
import { autoGenerateContextIfMissing, ensureAtlas } from "./context.js"
import { ensureLoopWorkspace } from "./loop.js"
import {
  ORCHESTRATOR_AGENT,
  buildGuardText,
  clampToolOutput,
  isBlockedOrchestratorCall,
  readStateSummary,
} from "./guard.js"

const PLUGIN_NAME = "devloom"

const COMPACTION_CONTEXT = [
  "DevLoom is active in this project. The summary MUST preserve:",
  '(1) routing rule — all code work is delegated via task(subagent:"devloom-orchestrator");',
  "(2) current pipeline state from .opencode/devloom/project/state.json and board.json (phase, active ticket, next step);",
  "(3) pending pipeline phases and open defects;",
  "(4) active git worktrees under .devloom-worktrees/ (branches, agents, merge status) — never lose track of parallel agent work;",
   "(5) project context at .opencode/devloom/context/ — tech stack, conventions, security, examples, and architecture atlas (auto-generated, pattern-aware code generation).",
   "(6) loop engineering state at .opencode/devloom/loop/ — pattern, cadence, level, budget, run history.",
].join(" ")

function createLifecycleHooks(_ctx: PluginInput): Hooks {
  const debug = env.DEVLOOM_DEBUG === "1"
  const rootDir = typeof _ctx.directory === "string" ? _ctx.directory : ""
  if (rootDir.length > 0 && existsSync(join(rootDir, ".opencode", "devloom"))) {
    ensureProjectWorkspace(rootDir)
    autoGenerateContextIfMissing(rootDir)
    ensureAtlas(rootDir)
    ensureLoopWorkspace(rootDir)
  }

  const agentBySession = new Map<string, string>()
  const sessionsFile = rootDir ? join(rootDir, ".opencode", "devloom", ".sessions.json") : ""

  // Restore persisted session→agent map (survives plugin reloads)
  if (sessionsFile && existsSync(sessionsFile)) {
    try {
      const data = JSON.parse(readFileSync(sessionsFile, "utf8")) as Record<string, string>
      for (const [sid, agent] of Object.entries(data)) agentBySession.set(sid, agent)
    } catch { /* ignore corrupt file */ }
  }

  const persistSessions = () => {
    if (!sessionsFile) return
    try {
      writeFileSync(sessionsFile, JSON.stringify(Object.fromEntries(agentBySession)))
    } catch { /* best effort */ }
  }

  let partCounter = 0

  const log = (message: string, data?: Record<string, unknown>) => {
    if (debug) {
      console.log(
        `[${new Date().toISOString()}] [${PLUGIN_NAME}]`,
        message,
        data ? JSON.stringify(data, null, 2) : ""
      )
    }
  }

  return {
    event: async ({ event }) => {
      log("Event received", {
        type: event.type,
        properties: Object.keys(event.properties ?? {}),
      })
    },

    "chat.message": async (input, output) => {
      if (input.agent) {
        agentBySession.set(input.sessionID, input.agent)
        persistSessions()
      }
      const guard = buildGuardText(input.agent, readStateSummary(rootDir))
      log("Message received", { agent: input.agent, sessionID: input.sessionID, guarded: !!guard })
      if (!guard) return
      output.parts.push({
        id: `prt_devloom_${Date.now().toString(36)}_${(partCounter++).toString(36)}`,
        sessionID: output.message?.sessionID ?? input.sessionID,
        messageID: output.message?.id ?? input.messageID ?? "",
        type: "text",
        text: guard,
        synthetic: true,
      })
    },

    "experimental.chat.system.transform": async (input, output) => {
      const agent = input.sessionID ? agentBySession.get(input.sessionID) : undefined
      const guard = buildGuardText(agent, readStateSummary(rootDir))
      if (guard) output.system.push(guard)
    },

    "experimental.session.compacting": async (_input, output) => {
      log("Compaction starting — injecting DevLoom preservation context")
      output.context.push(COMPACTION_CONTEXT)
    },

    "tool.execute.before": async ({ tool, sessionID }, output) => {
      log("Tool executing", { tool, sessionID })
      if (
        agentBySession.get(sessionID) === ORCHESTRATOR_AGENT &&
        isBlockedOrchestratorCall(tool, output.args)
      ) {
        throw new Error(
          "DevLoom guard: the orchestrator must not modify project files directly. " +
            'Delegate via task(subagent:"devloom-developer" | "devloom-repair" | ...). ' +
            "Only state writes under .opencode/devloom/ are allowed."
        )
      }
    },

    "tool.execute.after": async ({ tool, sessionID }, output) => {
      log("Tool completed", {
        tool,
        sessionID,
        title: output?.title,
        outputLength: output?.output?.length ?? 0,
      })
      // The orchestrator session lives for the whole pipeline; unclamped sub-agent
      // outputs are the main driver of context overflow there.
      if (
        agentBySession.get(sessionID) === ORCHESTRATOR_AGENT &&
        typeof output?.output === "string"
      ) {
        output.output = clampToolOutput(output.output)
      }
    },
  }
}

export { createLifecycleHooks }
