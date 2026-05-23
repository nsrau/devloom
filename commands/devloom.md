---
description: "DevLoom: weave a full software feature from a single prompt — requirements, code, tests, and docs"
agent: devloom-orchestrator
subtask: false
---

# Smart Resume Detection

```bash
# Create .opencode/devloom directory if not exists
mkdir -p .opencode/devloom

# Prompt sanitization: truncate and strip control characters
export SANITIZED_PROMPT="$(node -e "
  let p = process.argv[1] || '';
  p = p.slice(0, 4000).replace(/[\x00-\x08\x0E-\x1F\x7F]/g, '');
  const suspicious = /[\`\$\(\);\|&]/.test(p);
  if (suspicious) console.error('⚠️  Warning: prompt contains shell metacharacters');
  process.stdout.write(p);
" -- "$ARGUMENTS" 2>&1)"

# If sanitization produced output, use it; fallback to raw ARGUMENTS
if [ -z "$SANITIZED_PROMPT" ] && [ -n "$ARGUMENTS" ]; then
  SANITIZED_PROMPT="$ARGUMENTS"
fi

# Load project config — local config.json overrides global agent models
# ALL models MUST use opencode/ API prefix (e.g. opencode/deepseek-v4-flash-free)
if [ -f ".opencode/devloom/config.json" ]; then
  echo "📋 Applying local model config..."
  node -e "
    const c = JSON.parse(require('fs').readFileSync('.opencode/devloom/config.json','utf8'));
    const m = c.models || {};
    for (const [agent, model] of Object.entries(m)) {
      // Ensure model has opencode/ or opencode-go/ prefix
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

# Check if state exists
if [ -f ".opencode/devloom/state.json" ]; then
  PHASE=$(grep -o '"phase":"[^"]*"' .opencode/devloom/state.json | cut -d'"' -f4)
  COMPLETED=$(grep -o '"completed":\[' .opencode/devloom/state.json | wc -l)
  
  # If no arguments provided, RESUME existing execution
  if [ -z "$ARGUMENTS" ]; then
    echo "📋 Found existing execution at phase: $PHASE"
    echo "🔄 Resuming from saved state..."
    
    # Delegate to orchestrator resume logic (PRE-PHASE 0)
    echo "RESUMING_FROM_STATE"
  else
    # If prompt provided, treat as new execution with same project
    echo "ℹ️  Existing state found. Starting fresh execution with new prompt..."
  fi
else
  # No prior state
  if [ -z "$ARGUMENTS" ]; then
    echo "❌ No prior execution found. Use: /devloom [description]"
    echo "   Or use: /devloom init [description] to start fresh"
    exit 1
  fi
  
  echo "✨ Starting fresh DevLoom execution..."
fi
```

# Orchestrator Direction

$ARGUMENTS

IMPORTANT:
- Use `$SANITIZED_PROMPT` (sanitized, truncated to 4000 chars) as the user's prompt for all processing. The raw `$ARGUMENTS` is the original user input.
- If RESUMING_FROM_STATE: Use PRE-PHASE 0 resume detection. Skip completed phases.
- Otherwise: Run full PHASE 0 → PHASE 1 → PHASE 2 → PHASE 3 workflow.

Full workflow:
1. Run PHASE 0 — detect models, ask user preference, update agent files
2. Invoke @devloom-analyst to create requirements
3. Invoke @devloom-architect to create plan  
4. Loop through every task: developer → QA → (fix if needed) → mark [x]
5. Invoke @devloom-documenter and run final quality gate
6. Output DEVLOOM_DONE only when all tasks are [x] and build passes
