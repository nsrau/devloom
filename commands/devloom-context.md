---
description: "DevLoom Context: show, clear, or regenerate auto-detected project patterns"
agent: devloom-orchestrator
subtask: false
---

# DevLoom Context

Context is **auto-generated** by the plugin from your codebase (package.json, file structure, existing code). Agents load it automatically before generating code. No command needed — it just works.

This command is for manual override only:

```
/devloom-context --show          # display current context files
/devloom-context --regenerate    # force regenerate from codebase (overwrites)
/devloom-context --clear         # remove all context files
```

```bash
ACTION="${ARGUMENTS:---show}"
DIR=".opencode/devloom/context"

case "$ACTION" in
  --show)
    if [ ! -d "$DIR" ]; then
      echo "No context directory. Context auto-generates when the plugin loads."
      exit 0
    fi
    for f in "$DIR"/project.md "$DIR"/conventions.md "$DIR"/security.md "$DIR"/examples.md; do
      if [ -f "$f" ]; then
        echo "=== $(basename "$f") ==="
        cat "$f"
        echo ""
      fi
    done
    ;;
  --regenerate)
    mkdir -p "$DIR"
    node -e "
      const fs = require('fs');
      const path = require('path');
      const dir = '.opencode/devloom/context';
      fs.mkdirSync(dir, { recursive: true });
      const now = new Date().toISOString();
      let pkg = {};
      try { pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); } catch {}
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      const has = (f) => fs.existsSync(f);
      const lang = has('tsconfig.json') ? 'TypeScript' : has('go.mod') ? 'Go' : has('pyproject.toml') ? 'Python' : has('Cargo.toml') ? 'Rust' : pkg.name ? 'JavaScript' : 'Unknown';
      const fw = deps.next ? 'Next.js' : deps.react ? 'React' : deps.vue ? 'Vue' : deps.fastify ? 'Fastify' : deps.express ? 'Express' : deps.hono ? 'Hono' : 'Unknown';
      const orm = deps.drizzle ? 'Drizzle' : deps.prisma || has('prisma/schema.prisma') ? 'Prisma' : deps.typeorm ? 'TypeORM' : deps.mongoose ? 'Mongoose' : 'Unknown';
      const val = deps.zod ? 'Zod' : deps.yup ? 'Yup' : deps.joi ? 'Joi' : 'Unknown';
      const test = deps.jest || has('jest.config.mjs') ? 'Jest' : deps.vitest ? 'Vitest' : 'Unknown';
      const linter = deps.eslint ? 'ESLint' : deps.biome ? 'Biome' : 'Unknown';
      const pm = has('bun.lock') ? 'bun' : has('pnpm-lock.yaml') ? 'pnpm' : has('yarn.lock') ? 'yarn' : has('package-lock.json') ? 'npm' : 'Unknown';
      const libs = Object.keys(deps).filter(k => ['next-auth','jsonwebtoken','bcryptjs','argon2','stripe','twilio','sendgrid','nodemailer','ioredis','openai','winston','pino','dotenv','lodash','date-fns','dayjs','zod','drizzle-orm'].includes(k));

      fs.writeFileSync(dir + '/project.md', '# Project Patterns\n> Auto-generated: ' + now + '\n> MVI: keep under 200 lines. Edit manually to override.\n\n## Tech Stack\n- Language: ' + lang + '\n- Framework: ' + fw + '\n- ORM: ' + orm + '\n- Validation: ' + val + '\n- Testing: ' + test + '\n- Linter: ' + linter + '\n- Package manager: ' + pm + '\n\n## Architecture\n- Follow existing project structure\n- SOLID + Clean Architecture\n- Dependency inversion\n- Surgical changes: smallest correct diff\n\n## Key Libraries\n' + (libs.length ? libs.map(l => '- ' + l).join('\n') : '- (none detected)') + '\n');

      fs.writeFileSync(dir + '/conventions.md', '# Coding Conventions\n> Auto-generated: ' + now + '\n> MVI: keep under 200 lines.\n\n## Naming\n- Files: kebab-case\n- Components: PascalCase\n- Functions: camelCase\n- Constants: UPPER_SNAKE_CASE\n\n## Code Standards\n' + (lang === 'TypeScript' ? '- TypeScript strict mode\n- No any types\n- Explicit return types on public APIs\n' : '') + '- Prefer early returns\n- No magic numbers\n- Co-locate tests next to source\n- One component/module per file\n');

      fs.writeFileSync(dir + '/security.md', '# Security Requirements\n> Auto-generated: ' + now + '\n> MVI: keep under 200 lines.\n\n## Detected Patterns\n' + (deps.zod ? '- Input validation with Zod\n' : '') + (deps.bcryptjs || deps.argon2 ? '- Password hashing\n' : '') + (deps.jsonwebtoken ? '- JWT auth\n' : deps['next-auth'] ? '- NextAuth\n' : '') + (deps.helmet ? '- Helmet headers\n' : '') + (deps.cors ? '- CORS configured\n' : '') + '\n## Universal Rules\n- Never trust user input\n- Parameterized queries only\n- Secrets in environment variables\n- .env in .gitignore\n- Auth checks on every protected route\n');

      fs.writeFileSync(dir + '/examples.md', '# Code Examples\n> Auto-generated: ' + now + '\n> MVI: keep examples under 80 lines.\n\n## API Endpoint Pattern\n\`\`\`typescript\n// Follow your framework convention. Validate input, handle errors.\n\`\`\`\n\n## Component Pattern\n\`\`\`typescript\n// Follow your framework component convention.\n\`\`\`\n');

      console.log('Context regenerated in ' + dir);
    "
    ;;
  --clear)
    rm -rf "$DIR"
    echo "Context cleared. Will auto-generate on next plugin load."
    ;;
  *)
    echo "Usage: /devloom-context [--show|--regenerate|--clear]"
    echo "Context auto-generates from your codebase — no command needed."
    ;;
esac
```

OUT:
- context shown, regenerated, or cleared
- agents always auto-load context — this command is optional override only
