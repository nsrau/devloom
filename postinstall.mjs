#!/usr/bin/env node
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync, accessSync, constants } from "fs"
import { resolve, dirname, join, relative } from "path"
import { fileURLToPath } from "url"
import { homedir, platform } from "os"

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

let installFailed = false

export function installFile(src, dest, label, configDir) {
  const baseDir = configDir || getConfigDir()
  if (!existsSync(src)) {
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

const AGENTS = [
  "devloom-orchestrator",
  "devloom-analyst",
  "devloom-architect",
  "devloom-developer",
  "devloom-qa",
  "devloom-explorer",
  "devloom-route-verifier",
  "devloom-form-verifier",
  "devloom-a11y-verifier",
  "devloom-api-verifier",
  "devloom-journey-agent",
  "devloom-rca",
  "devloom-repair",
  "devloom-regression",
  "devloom-recovery",
  "devloom-documenter",
]

const COMMANDS = ["devloom", "devloom-status", "devloom-resume", "devloom-init", "devloom-save"]

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

  console.log("\nInstalling protocol modules:")
  ensureDir(PROTOCOL_DIR)
  for (const name of PROTOCOLS) {
    installFile(
      resolve(__dirname, "protocol", `${name}.md`),
      resolve(PROTOCOL_DIR, `${name}.md`),
      `Protocol: ${name}`
    )
  }

  if (!installFailed) {
    console.log(`
DevLoom installed successfully!

Start weaving:
  /devloom Build a REST API for user management with JWT auth
  /devloom-status

Protocol modules available at ~/.config/opencode/protocol/

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
