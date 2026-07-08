# DevLoom Loop Status Command
> /devloom-loop-status

## Usage
- `/devloom-loop-status` — Show loop health, recent runs, budget status

## Output
- Active pattern and cadence
- Last run timestamp and outcome
- Next scheduled run
- Budget: spent/limit, remaining, reset time
- Run count and success rate
- Paused status with reason if applicable
- Last 5 run log entries summary

## Example output
```
Loop: daily-triage (L1)
Cadence: 0 6 * * *
Status: active
Last run: 2026-07-08T06:00:00Z (success)
Budget: 50000/500000 (450000 remaining, resets at midnight)
Run count: 12 (100% success)
Last 5: all success
```
