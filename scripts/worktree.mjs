#!/usr/bin/env node
import { execSync } from "child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync, statSync } from "fs"
import { resolve, join, basename, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const WORKTREE_DIR = ".devloom-worktrees"
const REGISTRY_PATH = join(WORKTREE_DIR, ".registry.json")
const GIT_TIMEOUT = 30000

function git(rootDir, args, opts = {}) {
  const timeout = opts.timeout || GIT_TIMEOUT
  try {
    return execSync(`git ${args}`, {
      cwd: rootDir,
      encoding: "utf8",
      timeout,
      stdio: opts.stdio || ["pipe", "pipe", "pipe"],
    }).trim()
  } catch (err) {
    if (opts.throwOnError !== false) {
      const stderr = err.stderr ? err.stderr.trim() : ""
      throw new Error(`git ${args.split(" ")[0]} failed: ${err.message}${stderr ? " | " + stderr : ""}`)
    }
    return ""
  }
}

function gitOk(rootDir, args) {
  try {
    execSync(`git ${args}`, { cwd: rootDir, encoding: "utf8", timeout: GIT_TIMEOUT, stdio: ["pipe", "pipe", "pipe"] })
    return true
  } catch {
    return false
  }
}

function readJson(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, "utf8"))
  } catch {
    return fallback
  }
}

function writeJson(path, data) {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n")
}

function isGitRepo(rootDir) {
  return gitOk(rootDir, "rev-parse --is-inside-work-tree")
}

export function getCurrentBranch(rootDir) {
  return git(rootDir, "rev-parse --abbrev-ref HEAD")
}

export function isClean(rootDir) {
  const status = git(rootDir, "status --porcelain")
  return status.length === 0
}

export function hasUntrackedFiles(rootDir) {
  const status = git(rootDir, "status --porcelain")
  return status.split("\n").some(l => l.startsWith("??"))
}

function commitAll(rootDir, message) {
  git(rootDir, "add -A")
  if (isClean(rootDir)) return null
  git(rootDir, `commit -m ${JSON.stringify(message)}`)
  return git(rootDir, "rev-parse HEAD")
}

function stashIfDirty(rootDir) {
  if (isClean(rootDir)) return null
  try {
    return git(rootDir, `stash push -u -m ${JSON.stringify("devloom-auto-stash-" + Date.now())}`)
  } catch {
    return commitAll(rootDir, "devloom: auto-commit before worktree creation")
  }
}

function branchSlug(branchName) {
  return branchName.replace(/[^a-zA-Z0-9_-]/g, "-")
}

function worktreePath(rootDir, branchName) {
  return join(rootDir, WORKTREE_DIR, branchSlug(branchName))
}

function readRegistry(rootDir) {
  return readJson(join(rootDir, REGISTRY_PATH), { worktrees: [] })
}

function writeRegistry(rootDir, registry) {
  writeJson(join(rootDir, REGISTRY_PATH), registry)
}

function addToRegistry(rootDir, entry) {
  const reg = readRegistry(rootDir)
  const existing = reg.worktrees.findIndex(w => w.branch === entry.branch)
  if (existing >= 0) {
    reg.worktrees[existing] = entry
  } else {
    reg.worktrees.push(entry)
  }
  writeRegistry(rootDir, reg)
}

function removeFromRegistry(rootDir, branchName) {
  const reg = readRegistry(rootDir)
  reg.worktrees = reg.worktrees.filter(w => w.branch !== branchName)
  writeRegistry(rootDir, reg)
}

function ensureGitignore(rootDir) {
  const gitignorePath = join(rootDir, ".gitignore")
  const entry = ".devloom-worktrees/"
  try {
    const content = readFileSync(gitignorePath, "utf8")
    if (!content.includes(entry)) {
      writeFileSync(gitignorePath, content + (content.endsWith("\n") ? "" : "\n") + entry + "\n")
    }
  } catch {
    writeFileSync(gitignorePath, entry + "\n")
  }
}

export function createWorktree(rootDir, branchName, baseRef) {
  if (!isGitRepo(rootDir)) {
    throw new Error("not a git repository")
  }

  const ref = baseRef || getCurrentBranch(rootDir)
  const wtPath = worktreePath(rootDir, branchName)

  if (existsSync(wtPath)) {
    gitOk(rootDir, `worktree remove --force ${JSON.stringify(wtPath)}`)
    rmSync(wtPath, { recursive: true, force: true })
  }

  const existingBranches = git(rootDir, "branch --list", { throwOnError: false })
  if (existingBranches.includes(branchName)) {
    git(rootDir, `branch -D ${JSON.stringify(branchName)}`)
  }

  ensureGitignore(rootDir)

  if (!isClean(rootDir)) {
    commitAll(rootDir, `devloom: auto-commit before worktree ${branchName}`)
  }

  git(rootDir, `worktree add -b ${JSON.stringify(branchName)} ${JSON.stringify(wtPath)} ${JSON.stringify(ref)}`)

  const entry = {
    branch: branchName,
    path: wtPath,
    baseRef: ref,
    createdAt: new Date().toISOString(),
    ticket: branchName.includes("/") ? branchName.split("/")[1] : branchName,
    agent: branchName.split("/")[2] || "unknown",
  }
  addToRegistry(rootDir, entry)

  return entry
}

export function mergeWorktree(rootDir, branchName) {
  if (!isGitRepo(rootDir)) {
    throw new Error("not a git repository")
  }

  const wtPath = worktreePath(rootDir, branchName)
  if (!existsSync(wtPath)) {
    throw new Error(`worktree not found: ${branchName}`)
  }

  if (!isClean(wtPath)) {
    commitAll(wtPath, `devloom: auto-commit in worktree ${branchName} before merge`)
  }

  const currentBranch = getCurrentBranch(rootDir)
  if (!isClean(rootDir)) {
    commitAll(rootDir, `devloom: auto-commit before merge of ${branchName}`)
  }

  const mergeResult = git(rootDir, `merge --no-ff ${JSON.stringify(branchName)} -m ${JSON.stringify(`devloom: merge ${branchName}`)}`, { throwOnError: false })

  const hasMergeHead = gitOk(rootDir, "rev-parse -q --verify MERGE_HEAD")

  if (hasMergeHead) {
    const conflicts = []
    const status = git(rootDir, "diff --name-only --diff-filter=U", { throwOnError: false })
    if (status) {
      conflicts.push(...status.split("\n").filter(Boolean))
    }

    if (conflicts.length > 0 || mergeResult.includes("CONFLICT") || mergeResult.includes("Automatic merge failed")) {
      git(rootDir, "merge --abort")
      return {
        success: false,
        conflicts,
        message: `merge conflict in ${conflicts.length} file(s): ${conflicts.join(", ")}`,
        branch: branchName,
        worktreePath: wtPath,
      }
    }
    git(rootDir, "merge --abort")
    return {
      success: false,
      conflicts: [],
      message: "merge conflict detected (auto-aborted)",
      branch: branchName,
      worktreePath: wtPath,
    }
  }

  git(rootDir, `worktree remove ${JSON.stringify(wtPath)}`)
  git(rootDir, `branch -d ${JSON.stringify(branchName)}`, { throwOnError: false })
  rmSync(wtPath, { recursive: true, force: true })
  removeFromRegistry(rootDir, branchName)

  return {
    success: true,
    conflicts: [],
    message: `merged ${branchName} into ${currentBranch}`,
    branch: branchName,
    mergedInto: currentBranch,
  }
}

export function removeWorktree(rootDir, branchName, force = false) {
  if (!isGitRepo(rootDir)) {
    throw new Error("not a git repository")
  }

  const wtPath = worktreePath(rootDir, branchName)
  if (!existsSync(wtPath)) {
    removeFromRegistry(rootDir, branchName)
    return { removed: false, message: `worktree not found: ${branchName}` }
  }

  if (!force && !isClean(wtPath)) {
    const status = git(wtPath, "status --porcelain")
    throw new Error(`worktree ${branchName} has uncommitted changes. Use --force to discard.\nUncommitted:\n${status}`)
  }

  git(rootDir, `worktree remove --force ${JSON.stringify(wtPath)}`)
  git(rootDir, `branch -D ${JSON.stringify(branchName)}`, { throwOnError: false })
  rmSync(wtPath, { recursive: true, force: true })
  removeFromRegistry(rootDir, branchName)

  return { removed: true, message: `removed worktree ${branchName}` }
}

export function listWorktrees(rootDir) {
  if (!isGitRepo(rootDir)) return []
  const reg = readRegistry(rootDir)
  return reg.worktrees.filter(w => existsSync(w.path))
}

export function worktreeStatus(rootDir, branchName) {
  if (!isGitRepo(rootDir)) {
    throw new Error("not a git repository")
  }

  const reg = readRegistry(rootDir)
  const entry = reg.worktrees.find(w => w.branch === branchName)
  if (!entry || !existsSync(entry.path)) {
    return { branch: branchName, exists: false, clean: false, ahead: 0, behind: 0 }
  }

  const clean = isClean(entry.path)
  const aheadStr = git(rootDir, `rev-list --count ${JSON.stringify(entry.baseRef)}..${JSON.stringify(branchName)}`, { throwOnError: false })
  const behindStr = git(rootDir, `rev-list --count ${JSON.stringify(branchName)}..${JSON.stringify(entry.baseRef)}`, { throwOnError: false })

  return {
    branch: branchName,
    exists: true,
    path: entry.path,
    clean,
    ahead: parseInt(aheadStr) || 0,
    behind: parseInt(behindStr) || 0,
    createdAt: entry.createdAt,
    ticket: entry.ticket,
    agent: entry.agent,
  }
}

export function cleanWorktrees(rootDir, force = false) {
  if (!isGitRepo(rootDir)) return []
  const reg = readRegistry(rootDir)
  const results = []

  for (const w of reg.worktrees) {
    try {
      const aheadStr = git(rootDir, `rev-list --count ${JSON.stringify(w.baseRef)}..${JSON.stringify(w.branch)}`, { throwOnError: false })
      const ahead = parseInt(aheadStr) || 0
      const isMerged = ahead > 0 && gitOk(rootDir, `merge-base --is-ancestor ${JSON.stringify(w.branch)} HEAD`)
      if (isMerged || force) {
        const r = removeWorktree(rootDir, w.branch, true)
        results.push({ branch: w.branch, removed: true, ...r })
      } else {
        results.push({ branch: w.branch, removed: false, reason: "unmerged (use --force)" })
      }
    } catch (err) {
      results.push({ branch: w.branch, removed: false, reason: err.message })
    }
  }

  return results
}

function cmdCreate(rootDir, branchName, baseRef) {
  const entry = createWorktree(rootDir, branchName, baseRef)
  console.log(JSON.stringify({ ok: true, ...entry }, null, 2))
}

function cmdMerge(rootDir, branchName) {
  const result = mergeWorktree(rootDir, branchName)
  console.log(JSON.stringify({ ok: result.success, ...result }, null, 2))
  if (!result.success) process.exitCode = 1
}

function cmdRemove(rootDir, branchName, force) {
  const result = removeWorktree(rootDir, branchName, force)
  console.log(JSON.stringify({ ok: true, ...result }, null, 2))
}

function cmdList(rootDir) {
  const worktrees = listWorktrees(rootDir)
  if (worktrees.length === 0) {
    console.log("No active DevLoom worktrees.")
    return
  }
  console.log(`Active DevLoom worktrees (${worktrees.length}):`)
  for (const w of worktrees) {
    const st = worktreeStatus(rootDir, w.branch)
    const dirty = st.clean ? "clean" : "DIRTY"
    console.log(`  ${w.branch}  [${dirty}]  ahead=${st.ahead} behind=${st.behind}  ${w.path}`)
  }
}

function cmdStatus(rootDir, branchName) {
  if (branchName) {
    const st = worktreeStatus(rootDir, branchName)
    console.log(JSON.stringify(st, null, 2))
  } else {
    const worktrees = listWorktrees(rootDir)
    const statuses = worktrees.map(w => worktreeStatus(rootDir, w.branch))
    console.log(JSON.stringify(statuses, null, 2))
  }
}

function cmdClean(rootDir, force) {
  const results = cleanWorktrees(rootDir, force)
  if (results.length === 0) {
    console.log("No worktrees to clean.")
    return
  }
  for (const r of results) {
    const status = r.removed ? "removed" : `skipped (${r.reason})`
    console.log(`  ${r.branch}: ${status}`)
  }
}

function printHelp() {
  console.log("DevLoom Git Worktree Manager")
  console.log("")
  console.log("Usage:")
  console.log("  worktree.mjs create <branch> [--base <ref>]  Create a worktree on a new branch")
  console.log("  worktree.mjs merge <branch>                  Merge worktree branch to current, remove worktree")
  console.log("  worktree.mjs remove <branch> [--force]       Remove worktree + branch (force discards uncommitted)")
  console.log("  worktree.mjs list                            List active DevLoom worktrees")
  console.log("  worktree.mjs status [branch]                 Show worktree status")
  console.log("  worktree.mjs clean [--force]                 Remove all merged worktrees (or all with --force)")
  console.log("")
  console.log("Safety guarantees:")
  console.log("  - Auto-commits dirty changes before worktree creation")
  console.log("  - Auto-commits in worktree before merge")
  console.log("  - Aborts merge on conflict, keeps worktree for manual resolution")
  console.log("  - Never deletes unmerged branches without --force")
  console.log("")
  console.log("Branch naming convention: devloom/<ticket-id>/<agent-name>")
}

function main() {
  const args = process.argv.slice(2)
  const command = args[0] || ""
  const rootDir = process.cwd()

  try {
    switch (command) {
      case "create": {
        const branch = args[1]
        if (!branch) { console.error("Usage: worktree.mjs create <branch> [--base <ref>]"); process.exit(1) }
        const baseIdx = args.indexOf("--base")
        const baseRef = baseIdx >= 0 ? args[baseIdx + 1] : undefined
        cmdCreate(rootDir, branch, baseRef)
        break
      }
      case "merge": {
        const branch = args[1]
        if (!branch) { console.error("Usage: worktree.mjs merge <branch>"); process.exit(1) }
        cmdMerge(rootDir, branch)
        break
      }
      case "remove": {
        const branch = args[1]
        if (!branch) { console.error("Usage: worktree.mjs remove <branch> [--force]"); process.exit(1) }
        const force = args.includes("--force")
        cmdRemove(rootDir, branch, force)
        break
      }
      case "list":
        cmdList(rootDir)
        break
      case "status":
        cmdStatus(rootDir, args[1])
        break
      case "clean":
        cmdClean(rootDir, args.includes("--force"))
        break
      case "help":
      case "--help":
      case "-h":
        printHelp()
        break
      default:
        printHelp()
        process.exit(1)
    }
  } catch (err) {
    console.error(`Error: ${err.message}`)
    process.exit(1)
  }
}

const isMain = process.argv[1] ? fileURLToPath(import.meta.url) === resolve(process.argv[1]) : false
if (isMain) main()
