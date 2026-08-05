// TUI entrypoint for the DevLoom plugin.
//
// Why this exists: OpenCode's right sidebar is not fed from any agent
// directory — in the 1.18 TUI the rightbar renders ONLY plugin slots
// (`sidebar_title` / `sidebar_content` / `sidebar_footer`, see
// packages/tui/src/routes/session/sidebar.tsx). The agents configured via the
// server config hook are resolvable (Tab dialog, `@` menu, `/agent` endpoint)
// but never appear in the rightbar unless a TUI plugin renders them there.
// This module registers a `sidebar_content` slot that lists the DevLoom agents
// so a restarted session shows them in the right sidebar.
//
// Loaded by OpenCode only when the package exposes `exports["./tui"]` AND the
// plugin is listed in tui.json's `plugin` array (no directory auto-discovery).
// The loader rejects a module that exports both `server` and `tui`, so this
// target-exclusive module lives in its own file next to dist/index.js
// (`./server`).

import { createSignal } from "solid-js"
import { createElement, insert, setProp } from "@opentui/solid"
import type { TuiPlugin, TuiPluginApi, TuiPluginModule, TuiTheme } from "@opencode-ai/plugin/tui"
import {
  DEVOOM_SIDEBAR_MAX_ROWS,
  DEVOOM_SIDEBAR_ORDER,
  buildSidebarAgentViews,
  type SidebarAgent,
  type SidebarAgentView,
} from "./tui-agents.js"

type Theme = TuiTheme["current"]
type ElementNode = ReturnType<typeof createElement>
type Child = ElementNode | string | null | undefined | boolean | Array<Child> | (() => Child | Array<Child>)

/** Build an @opentui element tree without JSX (same primitives the host uses). */
function element(tag: string, props: Record<string, unknown> = {}, children: Child[] = []): ElementNode {
  const node = createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) setProp(node, key, value)
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue
    insert(node, child)
  }
  return node
}

function agentRow(agent: SidebarAgentView): ElementNode {
  const marker = agent.name === "devloom-orchestrator" ? "◈ " : "● "
  const shortName = agent.name.startsWith("devloom-") ? agent.name.slice("devloom-".length) : agent.name
  const model = agent.model ? `: ${agent.model}` : ""
  return element("text", { fg: agent.color }, [`${marker}${shortName}${model}`])
}

function renderRows(api: TuiPluginApi, agents: () => readonly SidebarAgent[]): ElementNode {
  return element("box", { flexDirection: "column" }, [
    () => {
      const theme: Theme = api.theme.current
      const view = buildSidebarAgentViews(agents())
      if (view.total === 0) {
        return element("text", { fg: theme.textMuted }, [
          "DevLoom agents will appear after /devloom-refresh + restart",
        ])
      }
      const rows: Child[] = []
      if (view.orchestrator) rows.push(agentRow(view.orchestrator))
      for (const other of view.others.slice(0, DEVOOM_SIDEBAR_MAX_ROWS)) rows.push(agentRow(other))
      if (view.others.length > DEVOOM_SIDEBAR_MAX_ROWS) {
        rows.push(
          element("text", { fg: theme.textMuted }, [
            `+${view.others.length - DEVOOM_SIDEBAR_MAX_ROWS} more`,
          ])
        )
      }
      return rows
    },
  ])
}

const tui: TuiPlugin = async (api) => {
  const [agents, setAgents] = createSignal<SidebarAgent[]>([])
  api.client.app
    .agents(undefined, { throwOnError: true })
    .then((result) => setAgents(result.data))
    .catch(() => setAgents([]))

  api.slots.register({
    order: DEVOOM_SIDEBAR_ORDER,
    slots: {
      sidebar_content() {
        const theme: Theme = api.theme.current
        return element("box", { flexDirection: "column", gap: 1, paddingRight: 1 }, [
          () => {
            const view = buildSidebarAgentViews(agents())
            const profile = view.profile ? ` - ${view.profile}` : ""
            return element("text", { fg: theme.text }, [element("b", {}, [`DevLoom${profile}`])])
          },
          renderRows(api, agents),
        ])
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: "devloom",
  tui,
}

export default plugin
