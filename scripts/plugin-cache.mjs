#!/usr/bin/env node
// Shared helpers for keeping the OpenCode plugin cache in sync with the
// installed DevLoom package.
//
// OpenCode installs npm plugins into `~/.cache/opencode/packages/<spec>` with
// `ignoreScripts: true`, so the package `postinstall` never runs there and the
// cached copy can silently go stale. These helpers refresh the cached package
// files (dist, agents, commands, ...) directly from a package source directory.
import {
  existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync,
  copyFileSync, rmSync, statSync,
} from "fs"
import { resolve, dirname, join } from "path"
import { fileURLToPath } from "url"
import { homedir, platform } from "os"
import { execFileSync } from "node:child_process"

export function getOpenCodeCacheDir(_platform = platform(), _homedir = homedir(), _env = process.env) {
  if (_platform === "win32") {
    return resolve(_env.LOCALAPPDATA ?? _homedir, "cache", "opencode")
  }
  if (_platform === "darwin") {
    return resolve(_homedir, "Library", "Caches", "opencode")
  }
  return resolve(_env.XDG_CACHE_HOME ?? join(_homedir, ".cache"), "opencode")
}

// Names of OpenCode plugin cache entries that contain a `devloom` package.
// Both `devloom` (legacy) and `devloom@latest` (current config spec) exist in
// the wild; refreshing both is harmless and covers every loader path.
export function openCodePluginEntries(cacheDir) {
  const packagesDir = join(cacheDir, "packages")
  if (!existsSync(packagesDir)) return []
  let entries = []
  try {
    entries = readdirSync(packagesDir)
  } catch {
    return []
  }
  return entries.filter((entry) => {
    try {
      return existsSync(join(packagesDir, entry, "node_modules", "devloom"))
    } catch {
      return false
    }
  })
}

function copyDir(src, dest) {
  if (existsSync(dest) && !statSync(src).isDirectory()) {
    rmSync(dest, { recursive: true, force: true })
  }
  const stat = statSync(src)
  if (stat.isDirectory()) {
    mkdirSync(dest, { recursive: true })
    for (const name of readdirSync(src)) {
      copyDir(join(src, name), join(dest, name))
    }
  } else {
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(src, dest)
  }
}

// Rebuild dist/ from source before it is copied into the OpenCode plugin cache,
// so a refresh never deploys stale compiled code. Runs the package's declared
// `build` script (npm run build) when present. Best-effort: never throws —
// failures are reported in the returned summary and the caller proceeds with
// whatever dist already exists.
export function buildPackageDist(sourceDir, exec = execFileSync) {
  const summary = { built: false, skipped: "", errors: [] }
  try {
    const pkg = JSON.parse(readFileSync(join(sourceDir, "package.json"), "utf8"))
    const build = pkg.scripts && typeof pkg.scripts.build === "string" ? pkg.scripts.build : ""
    if (!build) {
      summary.skipped = "no build script in package.json"
      return summary
    }
    exec("npm", ["run", "build"], { cwd: sourceDir, stdio: "ignore", timeout: 120_000 })
    summary.built = true
  } catch (err) {
    summary.errors.push(`build failed: ${err && typeof err.message === "string" ? err.message : String(err)}`)
  }
  return summary
}

// Copy the current package (dist, agents, commands, ... per package.json
// `files` plus package.json itself) into every existing OpenCode plugin cache
// entry. Best-effort: never throws, reports per-entry results.
export function refreshOpenCodePluginCache(sourceDir, cacheDir = getOpenCodeCacheDir(), exec = execFileSync) {
  const summary = { refreshed: [], skipped: [], errors: [], build: null }
  // Root-cause guard against the "status ok but stale" class of bugs: the
  // refresh pipeline must ship freshly built code, not whatever dist happens
  // to sit in the source tree. Rebuild before copying.
  const build = buildPackageDist(sourceDir, exec)
  summary.build = build
  if (build.errors.length > 0) summary.errors.push(...build.errors)
  let roots = []
  try {
    const pkg = JSON.parse(readFileSync(join(sourceDir, "package.json"), "utf8"))
    roots = Array.isArray(pkg.files) ? pkg.files : []
  } catch (err) {
    summary.errors.push(`cannot read package.json at ${sourceDir}: ${err.message}`)
    return summary
  }

  const entries = openCodePluginEntries(cacheDir)
  if (entries.length === 0) {
    summary.skipped.push(cacheDir)
    return summary
  }

  const toCopy = [...roots, "package.json"]
  for (const entry of entries) {
    const destPkg = join(cacheDir, "packages", entry, "node_modules", "devloom")
    let copied = 0
    for (const root of toCopy) {
      const src = join(sourceDir, root)
      if (!existsSync(src)) continue
      try {
        copyDir(src, join(destPkg, root))
        copied++
      } catch (err) {
        summary.errors.push(`${entry}/${root}: ${err.message}`)
      }
    }
    if (copied > 0) summary.refreshed.push(entry)
  }
  return summary
}

// Sync the installed agent files into the cached plugin package so a profile
// change is reflected even in the cache copy. Best-effort, never throws.
export function refreshOpenCodePluginAgentFiles(agentsDir, cacheDir = getOpenCodeCacheDir()) {
  const summary = { refreshed: [], skipped: [], errors: [] }
  const entries = openCodePluginEntries(cacheDir)
  if (entries.length === 0) {
    summary.skipped.push(cacheDir)
    return summary
  }
  for (const entry of entries) {
    const destAgents = join(cacheDir, "packages", entry, "node_modules", "devloom", "agents")
    try {
      mkdirSync(destAgents, { recursive: true })
      const files = readdirSync(agentsDir).filter((f) => f.startsWith("devloom-") && f.endsWith(".md"))
      for (const file of files) {
        copyFileSync(join(agentsDir, file), join(destAgents, file))
      }
      summary.refreshed.push(entry)
    } catch (err) {
      summary.errors.push(`${entry}: ${err.message}`)
    }
  }
  return summary
}

// Sync the runtime dependencies of the installed package into every existing
// cache entry. The TUI plugin (dist/tui.js) imports `@opentui/solid` +
// `solid-js`, and OpenCode installs plugins with `ignoreScripts` so those deps
// are not guaranteed to exist in the cache. Running `npm install` inside the
// cached plugin directory mirrors what a normal package install would do,
// without touching the cache entry root (no pruning of existing packages).
// Best-effort: never throws, reports per-entry results.
export function syncOpenCodePluginDependencies(sourceDir, cacheDir = getOpenCodeCacheDir(), exec = execFileSync) {
  const summary = { synced: [], skipped: [], errors: [] }
  const entries = openCodePluginEntries(cacheDir)
  if (entries.length === 0) {
    summary.skipped.push(cacheDir)
    return summary
  }
  for (const entry of entries) {
    const pluginDir = join(cacheDir, "packages", entry, "node_modules", "devloom")
    try {
      exec(
        "npm",
        [
          "install", "--prefix", pluginDir,
          "--no-save", "--ignore-scripts", "--no-audit", "--no-fund",
          "--no-package-lock", "--omit=dev", "--loglevel=error",
        ],
        { stdio: "ignore", timeout: 120_000 }
      )
      summary.synced.push(entry)
    } catch (err) {
      summary.errors.push(`${entry}: ${err && typeof err.message === "string" ? err.message : String(err)}`)
    }
  }
  return summary
}

// Per-entry cache health breakdown.
// "ok"   – every existing cache entry has the config hook that injects DevLoom
//          agents AND the current feature code (the profile-filter wiring in
//          dist/agents.js, detected via `agentVariantVisible`). Conservative:
//          one stale entry makes the whole cache stale.
// "stale"– at least one cache entry lacks the config hook or the feature code.
// "missing" – DevLoom was never installed as an OpenCode plugin.
export function pluginCacheStatusDetail(cacheDir = getOpenCodeCacheDir()) {
  const entries = openCodePluginEntries(cacheDir)
  if (entries.length === 0) return { status: "missing", entries: [] }
  const details = entries.map((entry) => {
    const base = join(cacheDir, "packages", entry, "node_modules", "devloom")
    let hook = false
    let featureCode = false
    let orchestratorLabel = false
    try {
      const pluginJs = join(base, "dist", "plugin.js")
      if (existsSync(pluginJs)) {
        hook = readFileSync(pluginJs, "utf8").includes("injectDevloomAgents")
      }
    } catch { /* entry treated as stale */ }
    try {
      // The profile-filter feature marker: present only in freshly built dist.
      const agentsJs = join(base, "dist", "agents.js")
      if (existsSync(agentsJs)) {
        featureCode = readFileSync(agentsJs, "utf8").includes("agentVariantVisible")
      }
    } catch { /* entry treated as stale */ }
    try {
      const orchestratorMd = join(base, "agents", "devloom-orchestrator.md")
      if (existsSync(orchestratorMd)) {
        orchestratorLabel = /\(profile: [^)]+\)/.test(readFileSync(orchestratorMd, "utf8"))
      }
    } catch { /* label unknown -> false */ }
    return { entry, hook, featureCode, orchestratorLabel }
  })
  const status = details.every((detail) => detail.hook && detail.featureCode) ? "ok" : "stale"
  return { status, entries: details }
}

export function pluginCacheStatus(cacheDir = getOpenCodeCacheDir()) {
  return pluginCacheStatusDetail(cacheDir).status
}

export function runCli(args, cacheDir = getOpenCodeCacheDir()) {
  const command = args[0] || ""
  if (command === "status") {
    const detail = pluginCacheStatusDetail(cacheDir)
    console.log(`DevLoom plugin cache: ${detail.status}`)
    if (detail.entries.length === 0) {
      console.log("  No DevLoom plugin cache entry found.")
      console.log("  Install the plugin once with: opencode plugin devloom --global")
      console.log("  then refresh the cache with: npm install -g devloom && node $(npm root -g)/devloom/postinstall.mjs")
      return detail.status
    }
    for (const entry of detail.entries) {
      const hook = entry.hook ? "yes" : "NO"
      const feature = entry.featureCode ? "yes" : "NO"
      const label = entry.orchestratorLabel ? "yes" : "no"
      console.log(`  ${entry.entry}: config-hook=${hook} feature-code=${feature} orchestrator-profile-label=${label}`)
    }
    if (detail.status !== "ok") {
      console.log("  Fix: run /devloom-refresh, then restart opencode (or: opencode --continue).")
    }
    return detail.status
  }
  console.log("DevLoom plugin cache helpers")
  console.log("Commands:")
  console.log("  devloom plugin-cache status  — print cache health (ok/stale/missing) + per-entry info")
  return null
}

const isMain = process.argv[1] ? fileURLToPath(import.meta.url) === resolve(process.argv[1]) : false
if (isMain) runCli(process.argv.slice(2))
