#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, cpSync } from "fs"
import { homedir } from "os"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { execSync } from "child_process"

const CONFIG_PATH = ".opencode/devloom/config.json"
const AGENTS_DIR = homedir() + "/.config/opencode/agents"
const SOURCE_AGENTS_DIR = resolve(dirname(new URL(import.meta.url).pathname), "..", "agents")

export const TIERS = {
  senior: {
    orchestrator: "opencode-go/deepseek-v4-flash",
    planner: "opencode-go/glm-5.2",
    developer: "opencode-go/kimi-k2.7-code",
    qa: "opencode-go/deepseek-v4-pro",
    verifier: "opencode-go/deepseek-v4-pro",
    security: "opencode-go/glm-5.2",
    documenter: "opencode-go/qwen3.7-plus",
    vision: "opencode-go/minimax-m3"
  },
  standard: {
    orchestrator: "opencode-go/deepseek-v4-flash",
    planner: "opencode-go/qwen3.7-max",
    developer: "opencode-go/kimi-k2.7-code",
    qa: "opencode-go/deepseek-v4-flash",
    verifier: "opencode-go/deepseek-v4-flash",
    security: "opencode-go/deepseek-v4-flash",
    documenter: "opencode-go/deepseek-v4-flash",
    vision: "opencode-go/mimo-v2.5"
  }
}

export const PROFILES = {
  go: {
    orchestrator: "opencode-go/deepseek-v4-flash",
    planner: "opencode-go/qwen3.7-max",
    developer: "opencode-go/kimi-k2.7-code",
    qa: "opencode-go/deepseek-v4-pro",
    verifier: "opencode-go/deepseek-v4-pro",
    security: "opencode-go/glm-5.2",
    documenter: "opencode-go/qwen3.7-plus",
    vision: "opencode-go/minimax-m3"
  },
  "go-economy": {
    orchestrator: "opencode-go/deepseek-v4-flash",
    planner: "opencode-go/deepseek-v4-pro",
    developer: "opencode-go/deepseek-v4-pro",
    qa: "opencode-go/deepseek-v4-flash",
    verifier: "opencode-go/deepseek-v4-flash",
    security: "opencode-go/deepseek-v4-pro",
    documenter: "opencode-go/qwen3.7-plus",
    vision: "opencode-go/minimax-m3"
  },
  deepseek: {
    orchestrator: "opencode-go/deepseek-v4-pro",
    planner: "opencode-go/deepseek-v4-pro",
    developer: "opencode-go/deepseek-v4-pro",
    qa: "opencode-go/deepseek-v4-pro",
    verifier: "opencode-go/deepseek-v4-flash",
    security: "opencode-go/deepseek-v4-pro",
    documenter: "opencode-go/deepseek-v4-flash",
    vision: "opencode-go/minimax-m3"
  },
  "go-flash": {
    orchestrator: "opencode-go/deepseek-v4-flash",
    planner: "opencode-go/deepseek-v4-flash",
    developer: "opencode-go/deepseek-v4-flash",
    qa: "opencode-go/deepseek-v4-flash",
    verifier: "opencode-go/deepseek-v4-flash",
    security: "opencode-go/deepseek-v4-flash",
    documenter: "opencode-go/deepseek-v4-flash",
    vision: "opencode-go/minimax-m3"
  }
}

export const FREE_CANDIDATES_BY_ROLE = {
  planning: ["opencode/nemotron-3-ultra-free", "opencode/big-pickle", "opencode/mimo-v2.5-free", "opencode/deepseek-v4-flash-free", "opencode/hy3-free", "opencode/north-mini-code-free"],
  implementation: ["opencode/mimo-v2.5-free", "opencode/deepseek-v4-flash-free", "opencode/nemotron-3-ultra-free", "opencode/big-pickle", "opencode/north-mini-code-free", "opencode/hy3-free"],
  verification: ["opencode/deepseek-v4-flash-free", "opencode/mimo-v2.5-free", "opencode/nemotron-3-ultra-free", "opencode/big-pickle", "opencode/north-mini-code-free", "opencode/hy3-free"],
  documentation: ["opencode/nemotron-3-ultra-free", "opencode/mimo-v2.5-free", "opencode/big-pickle", "opencode/deepseek-v4-flash-free", "opencode/hy3-free", "opencode/north-mini-code-free"],
  vision: ["opencode-go/minimax-m3", "opencode-go/glm-5.2", "opencode-go/kimi-k2.7-code"]
}

export const FREE_ROLE_MAP = {
  orchestrator: "planning",
  planner: "planning",
  developer: "implementation",
  qa: "verification",
  verifier: "verification",
  security: "verification",
  documenter: "documentation",
  vision: "vision"
}

export const ALL_AGENTS = Object.keys(FREE_ROLE_MAP)

function readJson(path, fallback = null) {
  try { return JSON.parse(readFileSync(path, "utf8")) } catch { return fallback }
}

function writeJson(path, data) {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n")
}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", timeout: 30000 }).trim()
  } catch {
    return ""
  }
}

export function detectAvailableModels() {
  const output = run("opencode models --refresh 2>/dev/null && opencode models 2>/dev/null")
  if (!output) return []
  const lines = output.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("lmstudio/"))
  return [...new Set(lines)]
}

export function hasGoModels(available) {
  return available.some(m => m.startsWith("opencode-go/"))
}

export function getFreeModels(available) {
  return available.filter(m => m.startsWith("opencode/") && m.endsWith("-free") || m === "opencode/big-pickle")
    .concat(available.filter(m => m.startsWith("opencode-go/free-")))
}

export function pickBestFree(available, role) {
  const candidates = FREE_CANDIDATES_BY_ROLE[role] || FREE_CANDIDATES_BY_ROLE.verification
  for (const c of candidates) {
    if (available.includes(c)) return c
  }
  for (const c of candidates) {
    for (const a of available) {
      if (a.startsWith("opencode/") && (a.includes(c.split("/").pop()?.split("-free")[0] || c) || c.includes(a.split("/").pop()?.split("-free")[0] || a))) {
        return a
      }
    }
  }
  const freeModels = getFreeModels(available)
  return freeModels.length > 0 ? freeModels[0] : "opencode/deepseek-v4-flash-free"
}

export function resolveFreeProfile(available) {
  const models = {}
  for (const agent of ALL_AGENTS) {
    const role = FREE_ROLE_MAP[agent]
    models[agent] = pickBestFree(available, role)
  }
  return models
}

export function validateModels(models, available) {
  const unavailable = []
  for (const [agent, model] of Object.entries(models)) {
    const short = model.startsWith("opencode-go/") || model.startsWith("opencode/")

    if (!short) {
      unavailable.push({ agent, model, reason: "invalid format" })
      continue
    }
    const matches = available.filter(a => a === model)
    if (matches.length === 0) {
      unavailable.push({ agent, model, reason: "not found in available models" })
    }
  }
  return unavailable
}

function containsKey(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

export function applyFallbacks(models, unavailable, available) {
  const result = { ...models }
  const fallbacks = {}
  for (const { agent, model } of unavailable) {
    if (containsKey(FREE_ROLE_MAP, agent)) {
      const role = FREE_ROLE_MAP[agent]
      const fb = pickBestFree(available, role)
      result[agent] = fb
      fallbacks[agent] = { from: model, to: fb }
    } else {
      const fb = pickBestFree(available, "verification")
      result[agent] = fb
      fallbacks[agent] = { from: model, to: fb }
    }
  }
  return { result, fallbacks }
}

function readConfig() {
  return readJson(CONFIG_PATH, {})
}

function writeConfig(config) {
  writeJson(CONFIG_PATH, config)
}

function ensureAgentFiles() {
  if (!existsSync(AGENTS_DIR)) {
    mkdirSync(AGENTS_DIR, { recursive: true })
  }
  const srcFiles = readdirSync(SOURCE_AGENTS_DIR).filter(f => f.startsWith("devloom-") && f.endsWith(".md"))
  const existing = new Set(readdirSync(AGENTS_DIR).filter(f => f.startsWith("devloom-") && f.endsWith(".md")))
  for (const f of srcFiles) {
    if (!existing.has(f)) {
      try { cpSync(resolve(SOURCE_AGENTS_DIR, f), resolve(AGENTS_DIR, f)) } catch {}
    }
  }
}

export function applyModelsToAgentFiles(models) {
  ensureAgentFiles()
  for (const [agent, model] of Object.entries(models)) {
    const f = resolve(AGENTS_DIR, `devloom-${agent}.md`)
    if (!existsSync(f)) continue
    try {
      let content = readFileSync(f, "utf8")
      content = content.replace(/^model: .*/m, `model: ${model}`)
      writeFileSync(f, content)
    } catch {}
  }
}

export function cmdApplyTier(tierName, available) {
  const tier = TIERS[tierName]
  if (!tier) {
    console.error("Unknown tier:", tierName)
    console.error("Valid tiers: senior, standard")
    process.exit(1)
  }

  const models = { ...tier }
  const unresolved = validateModels(models, available)
  if (unresolved.length > 0) {
    console.error(`Tier "${tierName}" has unavailable models:`)
    for (const u of unresolved) console.error(`  ${u.agent}: ${u.model}`)
    process.exit(1)
  }

  applyModelsToAgentFiles(models)

  const config = readConfig()
  config.tier = tierName
  config.tierModels = models
  config.models = { ...models }
  writeConfig(config)

  return models
}

export function cmdSet(profileName) {
  const available = detectAvailableModels()
  const hasGo = hasGoModels(available)

  if ((profileName === "go" || profileName === "go-economy" || profileName === "deepseek" || profileName === "go-flash") && !hasGo) {
    console.error("No OpenCode Go models detected. Run: opencode /connect to add OpenCode Go.")
    console.error("Fall back to: /devloom-auto or /devloom-free")
    process.exit(1)
  }

  let resolvedProfile = profileName
  let models = {}
  let fallbacks = {}
  let unavailable = []

  if (profileName === "go") {
    models = { ...PROFILES.go }
    unavailable = validateModels(models, available)
    if (unavailable.length > 0) {
      const fb = applyFallbacks(models, unavailable, available)
      models = fb.result
      fallbacks = fb.fallbacks
    }
  } else if (profileName === "go-economy") {
    models = { ...PROFILES["go-economy"] }
    unavailable = validateModels(models, available)
    if (unavailable.length > 0) {
      const fb = applyFallbacks(models, unavailable, available)
      models = fb.result
      fallbacks = fb.fallbacks
    }
  } else if (profileName === "free") {
    models = resolveFreeProfile(available)
    unavailable = validateModels(models, available)
  } else if (profileName === "deepseek") {
    models = { ...PROFILES.deepseek }
    unavailable = validateModels(models, available)
    if (unavailable.length > 0) {
      const fb = applyFallbacks(models, unavailable, available)
      models = fb.result
      fallbacks = fb.fallbacks
    }
  } else if (profileName === "go-flash") {
    models = { ...PROFILES["go-flash"] }
    unavailable = validateModels(models, available)
    if (unavailable.length > 0) {
      const fb = applyFallbacks(models, unavailable, available)
      models = fb.result
      fallbacks = fb.fallbacks
    }
  } else if (profileName === "auto") {
    if (hasGo) {
      models = { ...PROFILES["go-flash"] }
      resolvedProfile = "go-flash"
    } else {
      models = resolveFreeProfile(available)
      resolvedProfile = "free"
    }
    unavailable = validateModels(models, available)
    if (unavailable.length > 0) {
      const fb = applyFallbacks(models, unavailable, available)
      models = fb.result
      fallbacks = fb.fallbacks
    }
  } else {
    console.error("Unknown profile:", profileName)
    console.error("Valid profiles: auto, go, go-economy, deepseek, go-flash, free")
    process.exit(1)
  }

  const prev = readConfig()
  const config = {
    profile: profileName,
    resolvedProfile,
    models,
    overrides: prev.overrides || {},
    tier: prev.tier || null,
    tierModels: prev.tierModels || null,
    availableModelsSnapshot: available,
    fallbacks
  }

  writeConfig(config)
  applyModelsToAgentFiles(models)

  return config
}

export function cmdCurrent() {
  const config = readConfig()
  if (!config || !config.profile) {
    console.log("No DevLoom profile configured yet.")
    console.log("Run: /devloom-init or /devloom-auto")
    return
  }
  console.log(`Profile: ${config.profile}`)
  if (config.tier) console.log(`Tier: ${config.tier}`)
  console.log("")
  const activeModels = config.tierModels || config.models
  console.log("Resolved models:")
  for (const [agent, model] of Object.entries(activeModels)) {
    const tiered = config.tier && config.models[agent] !== model ? ` (tier: ${model})` : ""
    const overridden = config.overrides && config.overrides[agent] ? " (override)" : ""
    const fallbacked = config.fallbacks && config.fallbacks[agent] ? " (fallback)" : ""
    const base = config.tier ? config.models[agent] : null
    const label = base && base !== model ? `${base} → ${model}` : model
    console.log(`  ${agent}: ${label}${tiered}${overridden}${fallbacked}`)
  }
  if (config.unresolved && config.unresolved.length > 0) {
    console.log("")
    console.log("Unavailable models:")
    for (const u of config.unresolved) {
      console.log(`  ${u.agent}: ${u.model} (${u.reason})`)
    }
  }
  if (config.fallbacks && Object.keys(config.fallbacks).length > 0) {
    console.log("")
    console.log("Fallbacks applied:")
    for (const [agent, fb] of Object.entries(config.fallbacks)) {
      console.log(`  ${agent}: ${fb.from} -> ${fb.to}`)
    }
  }
}

export function cmdValidate() {
  const available = detectAvailableModels()
  const config = readConfig()
  if (!config || !config.models) {
    console.log("No DevLoom configuration to validate.")
    process.exit(1)
  }
  const allUnavailable = []
  for (const [agent, model] of Object.entries(config.models)) {
    if (!available.includes(model)) {
      allUnavailable.push({ agent, model, reason: "not available" })
    }
  }
  if (allUnavailable.length > 0) {
    console.log("Unavailable models:")
    for (const u of allUnavailable) {
      console.log(`  ${u.agent}: ${u.model}`)
    }
    process.exit(1)
  } else {
    console.log("All models are available.")
  }
}

export function cmdApply() {
  const config = readConfig()
  if (!config || !config.profile) {
    console.error("No profile configured. Run /devloom-init or /devloom-auto first.")
    process.exit(1)
  }
  const available = detectAvailableModels()
  const models = config.models || {}
  applyModelsToAgentFiles(models)

  config.availableModelsSnapshot = available
  config.requiresReload = true
  writeConfig(config)

  console.log("Profile applied to agent files.")
  console.log("")

  if (existsSync(AGENTS_DIR)) {
    const reopenScript = ".opencode/devloom/reopen.sh"
    writeFileSync(reopenScript, "#!/usr/bin/env bash\nexec opencode --continue\n")
    try { execSync(`chmod +x ${reopenScript}`) } catch {}

    console.log("If the current OpenCode session does not pick up the new agent models immediately,")
    console.log("continue the same session with:")
    console.log("")
    console.log("  opencode --continue")
    console.log("")
    console.log("Or run:")
    console.log(`  bash ${reopenScript}`)
  }
}

export function cmdDetect() {
  const available = detectAvailableModels()
  const hasGo = hasGoModels(available)

  console.log("Available models:", available.length)
  if (hasGo) {
    console.log("OpenCode Go models detected: yes")
    console.log("Recommended profile: go")
  } else {
    console.log("OpenCode Go models detected: no")
    console.log("Recommended profile: free")
  }
  const freeCount = getFreeModels(available).length
  console.log(`Free models available: ${freeCount}`)
}

function main() {
  const args = process.argv.slice(2)
  const command = args[0] || ""

  switch (command) {
    case "set":
      if (!args[1]) { console.error("Usage: devloom profile set <auto|go|go-economy|free>"); process.exit(1) }
      cmdSet(args[1])
      console.log(`DevLoom profile changed to: ${args[1]}`)
      if (args[1] !== "free") {
        console.log(`Resolved profile: ${args[1]}`)
      }
      break
    case "current":
      cmdCurrent()
      break
    case "validate":
      cmdValidate()
      break
    case "apply":
      cmdApply()
      break
    case "detect":
      cmdDetect()
      break
    case "tier":
      if (!args[1]) { console.error("Usage: devloom profile tier <senior|balanced|junior>"); process.exit(1) }
      if (!["senior","standard"].includes(args[1])) { console.error("Invalid tier. Valid: senior, standard"); process.exit(1) }
      const available = detectAvailableModels()
      cmdApplyTier(args[1], available)
      console.log(`DevLoom tier changed to: ${args[1]}`)
      break
    default:
      console.log("DevLoom Profile Manager")
      console.log("")
      console.log("Commands:")
      console.log("  devloom profile set <auto|go|go-economy|deepseek|go-flash|free>")
      console.log("  devloom profile tier <senior|standard>")
      console.log("  devloom profile current")
      console.log("  devloom profile validate")
      console.log("  devloom profile apply")
      console.log("  devloom profile detect")
  }
}

const isMain = process.argv[1] ? fileURLToPath(import.meta.url) === resolve(process.argv[1]) : false
if (isMain) main()
