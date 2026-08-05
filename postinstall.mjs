#!/usr/bin/env node
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, accessSync, constants, readFileSync, writeFileSync } from "fs"
import { resolve, dirname, join, relative } from "path"
import { fileURLToPath } from "url"
import { homedir, platform } from "os"
import { getOpenCodeCacheDir, refreshOpenCodePluginCache, syncOpenCodePluginDependencies } from "./scripts/plugin-cache.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))

export function getConfigDir(_platform = platform(), _homedir = homedir()) {
  if (_platform === "win32") {
    return resolve(process.env.APPDATA ?? _homedir, "opencode")
  }
  if (_platform === "darwin") {
    return resolve(_homedir, "Library", "Application Support", "opencode")
  }
  return resolve(
    process.env.XDG_CONFIG_HOME ?? join(_homedir, ".config"),
    "opencode"
  )
}

export function isPathSafe(basePath, resolvedPath) {
  const rel = relative(basePath, resolvedPath)
  return !rel.startsWith("..") && !rel.startsWith("/")
}

export function isDebug() {
  return process.env.DEVLOOM_DEBUG === "1" || process.env.DEVLOOM_DEBUG === "true"
}

export function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
    if (isDebug()) console.log(`[debug] Created directory: ${dir}`)
    console.log(`  Created: ${dir}`)
  }
}

// Register the DevLoom TUI plugin in tui.json's `plugin` array so OpenCode's
// TUI loads the rightbar sidebar slot (no directory auto-discovery for TUI
// plugins). Preserves every existing key (theme, keybinds, ...); dedupes the
// plugin entry; returns the merged object, or null when the file is corrupt
// (caller decides whether to warn).
export function ensureTuiPlugin(tuiPath, pluginName = "devloom") {
  let tui = {}
  if (existsSync(tuiPath)) {
    try {
      tui = JSON.parse(readFileSync(tuiPath, "utf8"))
    } catch {
      return null
    }
  }
  if (typeof tui !== "object" || tui === null || Array.isArray(tui)) return null
  if (!tui.$schema) tui.$schema = "https://opencode.ai/tui.json"
  const plugins = Array.isArray(tui.plugin) ? tui.plugin.filter((spec) => spec !== pluginName) : []
  plugins.push(pluginName)
  tui.plugin = plugins
  writeFileSync(tuiPath, JSON.stringify(tui, null, 2) + "\n")
  return tui
}

let installFailed = false

export function installFile(src, dest, label, configDir, optional = false) {
  const baseDir = configDir || getConfigDir()
  if (!existsSync(src)) {
    if (optional) {
      console.log(`  Skipped (not shipped) -- ${label}`)
      return
    }
    console.error(`  Source file not found: ${src}`)
    installFailed = true
    return
  }
  const destDir = dirname(dest)
  if (!isPathSafe(baseDir, resolve(destDir))) {
    console.error(`  Path traversal blocked -- ${label}: ${dest}`)
    installFailed = true
    return
  }
  try {
    accessSync(destDir, constants.W_OK)
  } catch {
    console.error(`  No write permission -- ${label}: ${destDir}`)
    installFailed = true
    return
  }
  try {
    copyFileSync(src, dest)
    if (isDebug()) {
      const srcStat = statSync(src)
      console.log(`[debug] Copied ${src} -> ${dest} (${srcStat.size} bytes)`)
    }
    console.log(`  ${label}`)
  } catch (err) {
    console.error(`  Failed -- ${label}: ${err.message}`)
    installFailed = true
  }
}

export function installDirRecursive(srcDir, destDir, labelPrefix, configDir) {
  const baseDir = configDir || getConfigDir()
  if (!existsSync(srcDir)) {
    console.error(`  Source dir not found: ${srcDir}`)
    installFailed = true
    return
  }
  const entries = readdirSync(srcDir)
  ensureDir(destDir)
  for (const entry of entries) {
    const srcPath = join(srcDir, entry)
    const destPath = join(destDir, entry)
    const stat = statSync(srcPath)
    if (stat.isDirectory()) {
      installDirRecursive(srcPath, destPath, `${labelPrefix}/${entry}`, baseDir)
    } else {
      installFile(srcPath, destPath, `${labelPrefix}/${entry}`, baseDir)
    }
  }
}

const CONFIG_DIR = getConfigDir()
const AGENTS_DIR  = resolve(CONFIG_DIR, "agents")
const COMMANDS_DIR = resolve(CONFIG_DIR, "commands")
const SKILLS_DIR = resolve(CONFIG_DIR, "skills")
const PROTOCOL_DIR = resolve(CONFIG_DIR, "protocol")
const AI_DIR = resolve(CONFIG_DIR, "devloom-ai")
const THEMES_DIR = resolve(CONFIG_DIR, "themes")

const AGENTS = [
  "devloom-orchestrator",
  "devloom-planner",
  "devloom-developer",
  "devloom-qa",
  "devloom-verifier",
  "devloom-security",
  "devloom-documenter",
  "devloom-vision",
  "devloom-planner-senior",
  "devloom-developer-senior",
  "devloom-security-senior",
  "devloom-planner-flash",
  "devloom-developer-flash",
  "devloom-qa-flash",
  "devloom-documenter-flash",
]

const COMMANDS = ["devloom", "devloom-status", "devloom-resume", "devloom-init", "devloom-save", "devloom-auto", "devloom-go", "devloom-go-economy", "devloom-go-flash", "devloom-deepseek", "devloom-free", "devloom-plan", "devloom-context", "devloom-agents", "devloom-refresh"]

const SCRIPTS_DIR = resolve(CONFIG_DIR, "devloom-scripts")

const PROTOCOLS = [
  "orchestrator-core",
  "agent-contracts",
  "artifact-system",
  "verification-policy",
  "project-system",
]

function main() {
  console.log("\nDevLoom -- post-install\n")
  console.log(`  Config dir  : ${CONFIG_DIR}`)
  console.log(`  Agents dir  : ${AGENTS_DIR}`)
  console.log(`  Commands dir: ${COMMANDS_DIR}`)
  console.log(`  Skills dir  : ${SKILLS_DIR}\n`)
  console.log(`  AI dir      : ${AI_DIR}\n`)

  if (isDebug()) console.log("[debug] Starting DevLoom post-install")

  ensureDir(AGENTS_DIR)
  ensureDir(COMMANDS_DIR)

  console.log("Installing agents:")
  for (const name of AGENTS) {
    installFile(
      resolve(__dirname, "agents", `${name}.md`),
      resolve(AGENTS_DIR, `${name}.md`),
      `Agent: ${name}`
    )
  }

  console.log("\nInstalling commands:")
  for (const name of COMMANDS) {
    installFile(
      resolve(__dirname, "commands", `${name}.md`),
      resolve(COMMANDS_DIR, `${name}.md`),
      `Command: /${name}`
    )
  }
  installFile(
    resolve(__dirname, "scripts", "profile.mjs"),
    resolve(COMMANDS_DIR, "profile.mjs"),
    "Profile manager"
  )
  installFile(
    resolve(__dirname, "scripts", "plugin-cache.mjs"),
    resolve(COMMANDS_DIR, "plugin-cache.mjs"),
    "Plugin cache helper"
  )

  console.log("\nInstalling skills:")
  installDirRecursive(
    resolve(__dirname, "skills"),
    SKILLS_DIR,
    "Skill"
  )

  console.log("\nInstalling AI DSL:")
  installDirRecursive(
    resolve(__dirname, ".ai"),
    AI_DIR,
    "AI"
  )

  console.log("\nInstalling profile manager scripts:")
  installDirRecursive(
    resolve(__dirname, "scripts"),
    SCRIPTS_DIR,
    "Script"
  )

  console.log("\nInstalling protocol modules:")
  ensureDir(PROTOCOL_DIR)
  for (const name of PROTOCOLS) {
    installFile(
      resolve(__dirname, "protocol", `${name}.md`),
      resolve(PROTOCOL_DIR, `${name}.md`),
      `Protocol: ${name}`
    )
  }

  // Install theme
  console.log("\nInstalling DevLoom Night Owl theme:")
  ensureDir(THEMES_DIR)
  const themeSrc = resolve(__dirname, ".opencode", "themes", "devloom-night-owl.json")
  const themeDest = resolve(THEMES_DIR, "devloom-night-owl.json")
  // ponytail: cosmetic asset — a missing theme must never fail the install
  installFile(themeSrc, themeDest, "Theme: DevLoom Night Owl", CONFIG_DIR, true)

  // Register the TUI plugin in tui.json (the right sidebar renders only plugin
  // slots, so this is what makes the DevLoom agents visible in the rightbar)
  // and activate the theme when no theme is set.
  const tuiPath = resolve(CONFIG_DIR, "tui.json")
  const tui = ensureTuiPlugin(tuiPath)
  if (tui === null) {
    console.log("  Skipping tui.json update (parse error)")
  } else {
    if (!tui.theme) {
      tui.theme = "devloom-night-owl"
      writeFileSync(tuiPath, JSON.stringify(tui, null, 2) + "\n")
      console.log("  Theme activated in tui.json (change via /theme)")
    } else {
      console.log(`  Theme already set: ${tui.theme} (change via /theme)`)
    }
    console.log("  DevLoom TUI plugin registered in tui.json (agents render in the right sidebar)")
  }

  // Refresh the OpenCode plugin cache so the plugin code loaded by the TUI
  // actually contains the config hook that injects DevLoom agents + profile
  // into the sidebar. Best-effort only: OpenCode installs plugins with
  // ignoreScripts, so this copy is the only way the cache picks up new code.
  // Cosmetic failures here must never fail the npm install.
  console.log("\nRefreshing OpenCode plugin cache:")
  const cacheDir = getOpenCodeCacheDir()
  const refresh = refreshOpenCodePluginCache(__dirname, cacheDir)
  if (refresh.build && refresh.build.built) {
    console.log("  Rebuilt dist/ before refreshing the plugin cache.")
  }
  if (refresh.build && refresh.build.errors.length > 0) {
    console.log(`  Warning (not fatal): dist rebuild failed — ${refresh.build.errors[0]}`)
  }
  for (const entry of refresh.refreshed) {
    console.log(`  Refreshed plugin cache: ${entry} -> fresh DevLoom code with the sidebar config hook`)
  }
  for (const entry of refresh.skipped) {
    console.log(`  Skipped: no OpenCode plugin cache entry found at ${entry}`)
  }
  for (const error of refresh.errors) {
    console.log(`  Warning (not fatal): plugin cache refresh failed for ${error}`)
  }
  if (refresh.skipped.length > 0 && refresh.refreshed.length === 0) {
    console.log("")
    console.log("  DevLoom is not yet registered as an OpenCode plugin.")
    console.log("  Install it once with: opencode plugin devloom --global")
    console.log("  then re-run this installer (or /devloom-refresh) to sync the plugin code.")
  } else if (refresh.errors.length > 0) {
    console.log("  The plugin cache could not be fully refreshed — run /devloom-refresh to retry.")
  }

  console.log("\nSyncing plugin cache dependencies (TUI sidebar plugin):")
  const deps = syncOpenCodePluginDependencies(__dirname, cacheDir)
  for (const entry of deps.synced) {
    console.log(`  Synced runtime deps: ${entry} (right-sidebar TUI plugin ready)`)
  }
  for (const entry of deps.skipped) {
    console.log(`  Skipped: no OpenCode plugin cache entry found at ${entry}`)
  }
  for (const error of deps.errors) {
    console.log(`  Warning (not fatal): dependency sync failed for ${error}`)
  }

  if (!installFailed) {
    console.log(`
DevLoom installed successfully!

Start weaving:
  /devloom Build a REST API for user management with JWT auth
  /devloom-status

Protocol modules available at ~/.config/opencode/protocol/

Theme: DevLoom Night Owl active (change via /theme or edit tui.json)

Debug mode:
  DEVLOOM_DEBUG=1 opencode @devloom-orchestrator
`)
  } else {
    console.error("\nSome files could not be installed. See errors above.")
    process.exit(1)
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main()
}
