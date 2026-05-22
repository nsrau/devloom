---
description: "Resume DevLoom from last execution point"
agent: devloom-orchestrator
subtask: false
---

# Initialize & Dashboard Setup

```bash
# Load project config — local config.json overrides global agent models
# ALL models MUST use opencode/ API prefix (e.g. opencode/deepseek-v4-flash-free)
if [ -f ".opencode/devloom/config.json" ]; then
  echo "📋 Applying local model config..."
  node -e "
    const c = JSON.parse(require('fs').readFileSync('.opencode/devloom/config.json','utf8'));
    const m = c.models || {};
    for (const [agent, model] of Object.entries(m)) {
      let finalModel = model.trim();
      if (!finalModel.startsWith('opencode/') && !finalModel.startsWith('opencode-go/')) {
        finalModel = 'opencode/' + finalModel;
        console.log('  ⚠️  Added opencode/ prefix to ' + agent + ': ' + model + ' -> ' + finalModel);
      }
      const f = require('os').homedir() + '/.config/opencode/agents/devloom-' + agent + '.md';
      try {
        const fs = require('fs');
        let content = fs.readFileSync(f, 'utf8');
        content = content.replace(/^model:.*/m, 'model: ' + finalModel);
        fs.writeFileSync(f, content);
        console.log('  ' + agent + ' -> ' + finalModel);
      } catch(e) { console.error('  Failed ' + agent + ': ' + e.message); }
    }
  "
fi

# Check state file
STATE_FILE=".opencode/devloom/state.json"

if [ -f "$STATE_FILE" ]; then
  PHASE=$(grep -o '"phase":"[^"]*"' "$STATE_FILE" | cut -d'"' -f4)
  echo "Resuming from $PHASE"
else
  echo "No execution state found. Use /devloom [prompt] to start new execution."
  exit 1
fi
```

# Resume DevLoom Orchestration

RESUME MODE ACTIVE: Execute PRE-PHASE 0 resume detection.

1. Check for existing `.opencode/devloom/state.json`
2. If found: Load phase, completedPhases, tasks.completed, requirements, plan
3. Skip all completed phases
4. Jump to next pending phase
5. Resume execution from that point with existing models and configuration
6. Do NOT run PHASE 0 (model selection) during resume

Execute all remaining tasks until complete, then PHASE 3 delivery and quality gate.
