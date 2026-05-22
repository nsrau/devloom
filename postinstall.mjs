#!/usr/bin/env node
// postinstall.mjs — Installs DevLoom agents, commands, and skills into OpenCode's global config dirs.

import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from "fs"
import { resolve, dirname, join, relative } from "path"
import { fileURLToPath } from "url"
import { homedir, platform } from "os"

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Config dir resolution (cross-platform) ────────────────────────────────────
function getConfigDir() {
  const os = platform()
  if (os === "win32") {
    return resolve(process.env.APPDATA ?? homedir(), "opencode")
  }
  if (os === "darwin") {
    return resolve(homedir(), "Library", "Application Support", "opencode")
  }
  return resolve(
    process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"),
    "opencode"
  )
}

const CONFIG_DIR = getConfigDir()
const AGENTS_DIR  = resolve(CONFIG_DIR, "agents")
const COMMANDS_DIR = resolve(CONFIG_DIR, "commands")
const SKILLS_DIR = resolve(CONFIG_DIR, "skills")

const AGENTS = [
  "devloom-orchestrator",
  "devloom-analyst",
  "devloom-architect",
  "devloom-developer",
  "devloom-qa",
  "devloom-documenter",
]

const COMMANDS = ["devloom", "devloom-status", "devloom-resume", "devloom-init"]

// ── Helpers ───────────────────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
    console.log(`  Created: ${dir}`)
  }
}

let installFailed = false

function installFile(src, dest, label) {
  if (!existsSync(src)) {
    console.error(`  Source file not found: ${src}`)
    installFailed = true
    return
  }
  try {
    copyFileSync(src, dest)
    console.log(`  ${label}`)
  } catch (err) {
    console.error(`  Failed -- ${label}: ${err.message}`)
    installFailed = true
  }
}

function installDirRecursive(srcDir, destDir, labelPrefix) {
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
      installDirRecursive(srcPath, destPath, `${labelPrefix}/${entry}`)
    } else {
      installFile(srcPath, destPath, `${labelPrefix}/${entry}`)
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log("\nDevLoom -- post-install\n")
console.log(`  Config dir  : ${CONFIG_DIR}`)
console.log(`  Agents dir  : ${AGENTS_DIR}`)
console.log(`  Commands dir: ${COMMANDS_DIR}`)
console.log(`  Skills dir  : ${SKILLS_DIR}\n`)

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

if (!installFailed) {
  console.log(`
DevLoom installed successfully!

Start weaving:
  /devloom Build a REST API for user management with JWT auth
  /devloom-status

Debug mode:
  DEVLOOM_DEBUG=1 opencode @devloom-orchestrator
`)
} else {
  console.error("\nSome files could not be installed. See errors above.")
  process.exit(1)
}
