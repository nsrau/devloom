# DevLoom Loop Command
> /devloom-loop start [pattern]|stop|status [--cadence <cron>] [--level L1|L2|L3] [--mode audit|fix] [--url <urls>]

## Usage
- `/devloom-loop start` — Start default loop (daily-triage, cadence "0 6 * * *", level L1)
- `/devloom-loop start ci-sweeper` — Start ci-sweeper (default cadence "0 6 * * *", level L1)
- `/devloom-loop start ci-sweeper --cadence "*/10 * * * *" --level L2` — Start with explicit config
- `/devloom-loop start pr-babysitter --cadence "*/15 * * * *" --level L2`
- `/devloom-loop start design-audit --mode audit --url "https://example.com"` — Run full audit (UI + functional: broken actions, missing actions, dead-ends, API issues), L1 report-only
- `/devloom-loop start design-audit --mode audit --url "https://site.com/page1,https://site.com/page2"` — Audit multiple pages
- `/devloom-loop start design-audit --mode fix` — Run fix loop (L2, worktree+verifier, run-until-done) — fixes both UI + functional issues, loops until all verified
- `/devloom-loop stop` — Pause all loop patterns
- `/devloom-loop status` — Show loop health, run history, budget

## What it does
1. Reads/creates loop-config.json with the specified pattern, cadence, level
2. Sets up budget.json with default daily limit 500K tokens
3. Logs the command to run-log.json
4. Outputs the cron/systemd timer command for the cadence

## Cron setup
To schedule the loop, add to crontab:
```
# DevLoom loop: daily-triage at 6 AM daily (pattern defaults to daily-triage)
0 6 * * * cd /path/to/repo && node scripts/loop-run.mjs --pattern daily-triage --cadence "0 6 * * *" --level L1 >> .opencode/devloom/loop/cron.log 2>&1
```

Simplified form (defaults to daily-triage, "0 0 * * *", L1):
```
0 0 * * * cd /path/to/repo && node scripts/loop-run.mjs >> .opencode/devloom/loop/cron.log 2>&1
```

## Output
- Loop started/stopped confirmation
- Cron command to schedule
- Budget status
