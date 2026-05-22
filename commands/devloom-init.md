---
description: "DevLoom Init: start fresh execution, clearing any prior state"
agent: devloom-orchestrator
subtask: false
---

# Force Fresh Start

```bash
# Create .opencode/devloom directory if not exists
mkdir -p .opencode/devloom

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

# Remove any existing state to force fresh start
rm -f .opencode/devloom/state.json
rm -f .opencode/devloom/errors.md

# Clear requirement/plan files if they exist
rm -f .opencode/devloom/requirements.md
rm -f .opencode/devloom/plan.md

echo "🔄 Clearing prior state - starting fresh"
```

# Fresh DevLoom Orchestration

$ARGUMENTS

IMPORTANT: Run full workflow from PHASE 0.

1. Run PHASE 0 — detect models, ask user preference, update agent files
2. Invoke @devloom-analyst to create requirements
3. Invoke @devloom-architect to create plan
4. Loop through every task: developer → QA → (fix if needed) → mark [x]
5. Invoke @devloom-documenter and run final quality gate
6. Output DEVLOOM_DONE only when all tasks are [x] and build passes
