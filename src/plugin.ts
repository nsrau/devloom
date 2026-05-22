import { env } from "node:process"
import type { Hooks, PluginInput } from "@opencode-ai/plugin"

const PLUGIN_NAME = "devloom"

function createLifecycleHooks(_ctx: PluginInput): Hooks {
  const debug = env.DEVLOOM_DEBUG === "1"

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

    "tool.execute.before": async ({ tool, sessionID }) => {
      log("Tool executing", { tool, sessionID })
    },

    "tool.execute.after": async ({ tool, sessionID }, output) => {
      log("Tool completed", {
        tool,
        sessionID,
        title: output?.title,
        outputLength: output?.output?.length ?? 0,
      })
    },
  }
}

export { createLifecycleHooks }
