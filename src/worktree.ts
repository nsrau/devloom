import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { join, dirname } from "node:path"

const WORKTREE_DIR = ".devloom-worktrees"
const REGISTRY_PATH = join(WORKTREE_DIR, ".registry.json")
const GIT_TIMEOUT = 30_000
const GIT_MAX_BUFFER = 10 * 1024 * 1024

export type WorktreeEntry = {
  branch: string
  path: string
  baseRef: string
  createdAt: string
  ticket: string
  agent: string
}

export type WorktreeStatus = {
  branch: string
  exists: boolean
  path?: string
  clean: boolean
  ahead: number
  behind: number
  createdAt?: string
  ticket?: string
  agent?: string
}

export type MergeResult = {
  success: boolean
  conflicts: string[]
  message: string
  branch: string
  worktreePath?: string
  mergedInto?: string
}

export type RemoveResult = {
  removed: boolean
  message: string
}

export type CleanResult = {
  branch: string
  removed: boolean
  reason?: string
}

type Registry = { worktrees: WorktreeEntry[] }

function git(rootDir: string, args: string[], opts: { timeout?: number; throwOnError?: boolean; stdio?: any } = {}): string {
  const timeout = opts.timeout ?? GIT_TIMEOUT
  try {
    const out = execFileSync("git", args, {
      cwd: rootDir,
      encoding: "utf8",
      timeout,
      maxBuffer: GIT_MAX_BUFFER,
      stdio: opts.stdio ?? ["pipe", "pipe", "pipe"],
    })
    return String(out).trim()
  } catch (err: any) {
    if (opts.throwOnError !== false) {
      const stderr = err.stderr ? String(err.stderr).trim() : ""
      throw new Error(`git ${args[0] || ""} failed: ${err.message}${stderr ? " | " + stderr : ""}`)
    }
    return ""
  }
}

function gitOk(rootDir: string, args: string[]): boolean {
  try {
    execFileSync("git", args, { cwd: rootDir, encoding: "utf8", timeout: GIT_TIMEOUT, maxBuffer: GIT_MAX_BUFFER, stdio: ["pipe", "pipe", "pipe"] })
    return true
  } catch {
    return false
  }
}

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T
  } catch {
    return fallback
  }
}

function writeJson(path: string, data: unknown): void {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n")
}

function isGitRepo(rootDir: string): boolean {
  return gitOk(rootDir, ["rev-parse", "--is-inside-work-tree"])
}

export function getCurrentBranch(rootDir: string): string {
  return git(rootDir, ["rev-parse", "--abbrev-ref", "HEAD"])
}

export function isClean(rootDir: string): boolean {
  const status = git(rootDir, ["status", "--porcelain"])
  return status.length === 0
}

function commitAll(rootDir: string, message: string): string | null {
  git(rootDir, ["add", "-A"])
  if (isClean(rootDir)) return null
  git(rootDir, ["commit", "-m", message])
  return git(rootDir, ["rev-parse", "HEAD"])
}

function branchSlug(branchName: string): string {
  return branchName.replace(/[^a-zA-Z0-9_-]/g, "-")
}

function worktreePath(rootDir: string, branchName: string): string {
  return join(rootDir, WORKTREE_DIR, branchSlug(branchName))
}

function readRegistry(rootDir: string): Registry {
  return readJson<Registry>(join(rootDir, REGISTRY_PATH), { worktrees: [] })
}

function writeRegistry(rootDir: string, registry: Registry): void {
  writeJson(join(rootDir, REGISTRY_PATH), registry)
}

function addToRegistry(rootDir: string, entry: WorktreeEntry): void {
  const reg = readRegistry(rootDir)
  const idx = reg.worktrees.findIndex((w) => w.branch === entry.branch)
  if (idx >= 0) reg.worktrees[idx] = entry
  else reg.worktrees.push(entry)
  writeRegistry(rootDir, reg)
}

function removeFromRegistry(rootDir: string, branchName: string): void {
  const reg = readRegistry(rootDir)
  reg.worktrees = reg.worktrees.filter((w) => w.branch !== branchName)
  writeRegistry(rootDir, reg)
}

export function createWorktree(rootDir: string, branchName: string, baseRef?: string): WorktreeEntry {
  if (!isGitRepo(rootDir)) throw new Error("not a git repository")

  const ref = baseRef || getCurrentBranch(rootDir)
  const wtPath = worktreePath(rootDir, branchName)

  if (existsSync(wtPath)) {
    gitOk(rootDir, ["worktree", "remove", "--force", wtPath])
    rmSync(wtPath, { recursive: true, force: true })
  }

  // Exact match: a substring test makes a sibling branch (`feat/x-old`) look
  // like a collision with `feat/x`, and the resulting `branch -D` then throws.
  const existing = git(rootDir, ["branch", "--list", "--format=%(refname:short)"], { throwOnError: false })
    .split("\n")
    .map((b) => b.trim())
  if (existing.includes(branchName)) {
    git(rootDir, ["branch", "-D", branchName])
  }

  ensureGitignore(rootDir)

  if (!isClean(rootDir)) {
    commitAll(rootDir, `devloom: auto-commit before worktree ${branchName}`)
  }

  git(rootDir, ["worktree", "add", "-b", branchName, wtPath, ref])

  const parts = branchName.split("/")
  const entry: WorktreeEntry = {
    branch: branchName,
    path: wtPath,
    baseRef: ref,
    createdAt: new Date().toISOString(),
    ticket: parts[1] || branchName,
    agent: parts[2] || "unknown",
  }
  addToRegistry(rootDir, entry)
  return entry
}

function ensureGitignore(rootDir: string): void {
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

export function mergeWorktree(rootDir: string, branchName: string): MergeResult {
  if (!isGitRepo(rootDir)) throw new Error("not a git repository")

  const wtPath = worktreePath(rootDir, branchName)
  if (!existsSync(wtPath)) throw new Error(`worktree not found: ${branchName}`)

  if (!isClean(wtPath)) {
    commitAll(wtPath, `devloom: auto-commit in worktree ${branchName} before merge`)
  }

  const currentBranch = getCurrentBranch(rootDir)
  if (!isClean(rootDir)) {
    commitAll(rootDir, `devloom: auto-commit before merge of ${branchName}`)
  }

  const mergeOut = git(rootDir, ["merge", "--no-ff", branchName, "-m", `devloom: merge ${branchName}`], { throwOnError: false })

  const hasMergeHead = gitOk(rootDir, ["rev-parse", "-q", "--verify", "MERGE_HEAD"])

  if (hasMergeHead) {
    const conflictFiles = git(rootDir, ["diff", "--name-only", "--diff-filter=U"], { throwOnError: false })
    const conflicts = conflictFiles ? conflictFiles.split("\n").filter(Boolean) : []

    if (conflicts.length > 0 || mergeOut.includes("CONFLICT") || mergeOut.includes("Automatic merge failed")) {
      git(rootDir, ["merge", "--abort"])
      return {
        success: false,
        conflicts,
        message: `merge conflict in ${conflicts.length} file(s): ${conflicts.join(", ")}`,
        branch: branchName,
        worktreePath: wtPath,
      }
    }
    git(rootDir, ["merge", "--abort"])
    return {
      success: false,
      conflicts: [],
      message: "merge conflict detected (auto-aborted)",
      branch: branchName,
      worktreePath: wtPath,
    }
  }

  git(rootDir, ["worktree", "remove", wtPath])
  git(rootDir, ["branch", "-d", branchName], { throwOnError: false })
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

export function removeWorktree(rootDir: string, branchName: string, force = false): RemoveResult {
  if (!isGitRepo(rootDir)) throw new Error("not a git repository")

  const wtPath = worktreePath(rootDir, branchName)
  if (!existsSync(wtPath)) {
    removeFromRegistry(rootDir, branchName)
    return { removed: false, message: `worktree not found: ${branchName}` }
  }

  if (!force && !isClean(wtPath)) {
    const status = git(wtPath, ["status", "--porcelain"])
    throw new Error(`worktree ${branchName} has uncommitted changes. Use --force to discard.\nUncommitted:\n${status}`)
  }

  git(rootDir, ["worktree", "remove", "--force", wtPath])
  git(rootDir, ["branch", "-D", branchName], { throwOnError: false })
  rmSync(wtPath, { recursive: true, force: true })
  removeFromRegistry(rootDir, branchName)

  return { removed: true, message: `removed worktree ${branchName}` }
}

export function listWorktrees(rootDir: string): WorktreeEntry[] {
  if (!isGitRepo(rootDir)) return []
  const reg = readRegistry(rootDir)
  return reg.worktrees.filter((w) => existsSync(w.path))
}

export function worktreeStatus(rootDir: string, branchName: string): WorktreeStatus {
  if (!isGitRepo(rootDir)) throw new Error("not a git repository")

  const reg = readRegistry(rootDir)
  const entry = reg.worktrees.find((w) => w.branch === branchName)
  if (!entry || !existsSync(entry.path)) {
    return { branch: branchName, exists: false, clean: false, ahead: 0, behind: 0 }
  }

  const clean = isClean(entry.path)
  const aheadStr = git(rootDir, ["rev-list", "--count", `${entry.baseRef}..${branchName}`], { throwOnError: false })
  const behindStr = git(rootDir, ["rev-list", "--count", `${branchName}..${entry.baseRef}`], { throwOnError: false })

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

export function cleanWorktrees(rootDir: string, force = false): CleanResult[] {
  if (!isGitRepo(rootDir)) return []
  const reg = readRegistry(rootDir)
  const results: CleanResult[] = []

  for (const w of reg.worktrees) {
    try {
      const aheadStr = git(rootDir, ["rev-list", "--count", `${w.baseRef}..${w.branch}`], { throwOnError: false })
      const ahead = parseInt(aheadStr) || 0
      // `ahead > 0` is deliberate: a 0-commit worktree is one an agent is still
      // working in, and reclaiming it would discard uncommitted work.
      const isMerged = ahead > 0 && gitOk(rootDir, ["merge-base", "--is-ancestor", w.branch, "HEAD"])
      if (isMerged || force) {
        removeWorktree(rootDir, w.branch, true)
        results.push({ branch: w.branch, removed: true })
      } else {
        results.push({ branch: w.branch, removed: false, reason: "unmerged (use --force)" })
      }
    } catch (err: any) {
      results.push({ branch: w.branch, removed: false, reason: err.message })
    }
  }

  return results
}

export function readWorktreeSummary(rootDir: string): string {
  const worktrees = listWorktrees(rootDir)
  if (worktrees.length === 0) return "worktrees=0"
  const statuses = worktrees.map((w) => worktreeStatus(rootDir, w.branch))
  const dirty = statuses.filter((s) => !s.clean).length
  const total = statuses.length
  return `worktrees=${total} dirty=${dirty}`
}
