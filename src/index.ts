import type { Plugin } from "@opencode-ai/plugin"
import { createLifecycleHooks } from "./plugin.js"

export const DevLoomPlugin: Plugin = async (ctx) => {
  return createLifecycleHooks(ctx)
}

export default DevLoomPlugin
