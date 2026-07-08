#!/usr/bin/env node
/**
 * DevLoom Loop Runner — Single loop tick executor
 * Usage: node scripts/loop-run.mjs [--pattern <name>] [--cadence <cron>] [--level L1|L2|L3]
 *
 * Reads loop config, validates pattern, checks budget, constructs prompt,
 * logs outcome.
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

function readJson(path, fallback) {
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

function nextMidnightISO() {
  const now = new Date()
  const mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  return mid.toISOString()
}

function parseArgs() {
  const args = {}
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i]
    if (arg.startsWith("--")) {
      const key = arg.slice(2)
      const val = process.argv[i + 1]
      if (val && !val.startsWith("--")) {
        args[key] = val
        i++
      } else {
        args[key] = true
      }
    }
  }
  return args
}

// --- Main ---
async function main() {
  const cli = parseArgs()
  const loopDir = join(ROOT, ".opencode", "devloom", "loop")

  // 1. Read loop config
  const configPath = join(loopDir, "loop-config.json")
  const config = readJson(configPath, {})
  config.pattern = cli.pattern || config.pattern || "daily-triage"
  config.cadence = cli.cadence || config.cadence || "0 0 * * *"
  config.level = cli.level || config.level || "L1"
  config.paused = config.paused || false

  // 2a. Read until-done progress if mode is until-done
  let progress = null
  if (config.mode === "until-done") {
    const progressPath = join(loopDir, "progress.json")
    progress = readJson(progressPath, null)
  }

  // 2. Validate pattern exists
  const registryPath = join(ROOT, "patterns", "registry.yaml")
  const patternPath = join(ROOT, "patterns", `${config.pattern}.md`)

  if (!existsSync(registryPath)) {
    console.log("Warning: patterns/registry.yaml not found. Pattern validation skipped.")
  }
  if (!existsSync(patternPath)) {
    console.log(`Error: pattern file not found: patterns/${config.pattern}.md`)
    process.exit(1)
  }

  // 3. Check budget
  const budgetPath = join(loopDir, "budget.json")
  const budget = readJson(budgetPath, { dailyLimit: 500000, spent: 0, resetAt: nextMidnightISO() })

  const now = new Date()
  const resetAt = new Date(budget.resetAt)
  if (now >= resetAt) {
    budget.spent = 0
    budget.resetAt = nextMidnightISO()
    writeJson(budgetPath, budget)
  }

  const remaining = Math.max(0, budget.dailyLimit - budget.spent)
  if (remaining <= 0) {
    config.paused = true
    writeJson(configPath, config)
    console.log(`Budget exceeded (${budget.spent}/${budget.dailyLimit}). Loop paused.`)
    console.log("Reset at:", budget.resetAt)
    process.exit(1)
  }

  // 3a. Check until-done completion
  if (config.mode === "until-done" && progress) {
    const allVerified = progress.items.every((i) => i.status === "verified")
    if (allVerified) {
      console.log("===== Design-Audit Complete =====")
      console.log(`All ${progress.total} pages verified against design system spec.`)
      console.log("Fix loop finished. No more pages to process.")
      process.exit(0)
    }
  }

  // 4. Record start time
  const startTime = Date.now()

  // 5. Pattern cost estimate
  const patternContent = readFileSync(patternPath, "utf8")
  const costMatch = patternContent.match(/cost:\s*(\d+)/)
  const estimatedCost = costMatch ? parseInt(costMatch[1]) : 50000

  // 6. Construct prompt
  let progressContext = ""
  if (config.mode === "until-done" && progress) {
    const pending = progress.items.filter((i) => i.status === "pending").length
    const inProgress = progress.items.filter((i) => i.status === "in-progress").length
    const byCategory = {}
    for (const item of progress.items) {
      const cat = item.category || "uncategorized"
      byCategory[cat] = (byCategory[cat] || 0) + 1
    }
    const catSummary = Object.entries(byCategory).map(([k, v]) => `${k}=${v}`).join(" ")
    progressContext = `\nProgress: ${progress.verified}/${progress.total} verified, ${pending} pending, ${inProgress} in-progress\nIssues by category: ${catSummary}\nCompletion condition: ${progress.completionCondition}`
  }

  const prompt = [
    `[devloom-loop] Running pattern: ${config.pattern}`,
    `Level: ${config.level}`,
    `Cadence: ${config.cadence}`,
    `Mode: ${config.mode || "recurring"}`,
    `Budget remaining: ${remaining}/${budget.dailyLimit}`,
    progressContext,
    "",
    `Pattern loaded from patterns/${config.pattern}.md.`,
    `Execute the pattern's agent chain and log results.`,
  ].join("\n")

  // 7. In headless mode: opencode run "<prompt>"
  // For now, construct the command and log it
  const headlessCmd = `opencode run "${prompt.replace(/"/g, '\\"')}"`
  console.log("===== DevLoom Loop Tick =====")
  console.log("Pattern:", config.pattern)
  console.log("Level:", config.level)
  console.log("Mode:", config.mode || "recurring")
  if (config.mode === "until-done" && progress) {
    console.log("Progress:", `${progress.verified}/${progress.total} verified`)
    const byCat = {}
    for (const item of progress.items) {
      const cat = item.category || "uncategorized"
      byCat[cat] = (byCat[cat] || 0) + 1
    }
    console.log("Issues:", Object.entries(byCat).map(([k, v]) => `${k}=${v}`).join(", "))
  }
  console.log("Budget remaining:", remaining)
  console.log("Estimated cost:", estimatedCost)
  console.log("")
  console.log("Headless command:")
  console.log(headlessCmd)
  console.log("")
  console.log("===== Prompt =====")
  console.log(prompt)

  // 8. Record outcome
  const durationMs = Date.now() - startTime
  const runLogPath = join(loopDir, "run-log.json")
  const runLog = readJson(runLogPath, [])
  runLog.push({
    timestamp: new Date().toISOString(),
    pattern: config.pattern,
    agentsUsed: [],
    outcome: "success",
    tokenCost: estimatedCost,
    durationMs,
    ...(config.mode === "until-done" && progress ? { progress: `${progress.verified}/${progress.total} verified` } : {}),
  })
  writeJson(runLogPath, runLog)

  // 9. Deduct estimated cost from budget
  budget.spent += estimatedCost
  writeJson(budgetPath, budget)

  console.log("")
  console.log("Tick completed in", durationMs, "ms")
  console.log("Cost deducted:", estimatedCost)
  console.log("Run log updated")
}

main().catch((err) => {
  console.error("Loop runner error:", err.message)
  process.exit(1)
})
