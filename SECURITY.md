# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Active development |

## Reporting a Vulnerability

DevLoom is an OpenCode plugin that executes AI-generated code and shell commands
in your development environment. While we take precautions, **you should review
all generated code before running it in production**.

To report a security vulnerability:

1. **Do NOT** open a public GitHub issue.
2. Email the maintainer directly (see `package.json` for contact) with:
   - Description of the vulnerability
   - Steps to reproduce
   - Affected versions
   - Any suggested fix (optional)
3. You should receive a response within 72 hours.
4. We will work with you to understand the issue and release a fix.
5. Credit will be given to reporters in the release notes.

## Security Assumptions

- **User permissions**: DevLoom runs with the same permissions as the user who
  installed it. It does not escalate privileges.
- **Agent trust model**: AI agents execute tasks described in their agent files
  (`agents/*.md`). They operate autonomously within the bounds defined by the
  agent's `permission` block (edit, bash, webfetch, etc.).
- **Prompt sanitization**: User prompts are truncated to 4000 characters and
  control characters are stripped. However, AI agents may still follow
  instructions embedded in prompts, repository docs, comments, issues, and
  generated files. **Prompt injection risk is present** — always review
  agent outputs critically, especially when using autonomous agents with
  bash/edit permissions.
- **Network access**: Agents may fetch external resources via `webfetch`.
  Model API calls go through OpenCode's infrastructure.
- **Go models improve quality but do not remove the need for review**:
  OpenCode Go models (GLM 5.1, Kimi K2.6, DeepSeek V4 Pro/Flash) produce
  higher-quality output and follow instructions more reliably than free-tier
  models, but they are still AI systems. All generated code must be reviewed
  before deployment.

## Autonomous Agent Risks

DevLoom agents operate autonomously with edit, bash, and webfetch permissions.
This introduces unique security considerations:

- **Hard delegation**: The orchestrator agent has `edit: deny`, `write: deny`,
  `patch: deny` at the OpenCode permission level. Code production is only
  possible via `task()` delegation to sub-agents. Sub-agents have `task: deny`,
  preventing delegation chains. This is enforced by OpenCode itself, not by the
  plugin — it survives plugin reloads.
- **Least privilege**: Each agent's `permission` block should be restricted to
  the minimum required for its role. Verifier agents (route, form, a11y, API)
  do not need write access to production source files.
- **bash permissions**: Agents with `bash: allow` can execute arbitrary shell
  commands. Never grant bash permission to agents that process untrusted input.
  The orchestrator uses bash ONLY for state persistence in `.opencode/devloom/`
  — sub-agents have full bash for implementation.
- **Destructive commands**: The `bash` tool should not be used to run
  destructive commands (rm -rf, drop table, etc.) without explicit user
  confirmation. OpenCode's permission system can prompt for confirmation.
- **Defect retry limits**: The orchestrator enforces a max of 3 retry cycles
  per defect. Beyond that, the ticket is marked blocked and reported — agents
  are not allowed to loop indefinitely on the same issue.

## Best Practices

1. **Pin versions**: Use exact version pins in `package.json` rather than ranges.
2. **Review changes**: Always review code, tests, and documentation generated
   by DevLoom before committing or deploying.
3. **Limit permissions**: The `permission` block in agent files controls what
   agents can do. Review and restrict as needed.
4. **Audit dependencies**: Run `npm audit` regularly.
5. **Use `.opencode/` directory isolation**: Keep DevLoom state in
   `.opencode/devloom/` — add this directory to your `.gitignore` if you do not
   want execution state tracked in version control.
6. **Prefer Go models for security-sensitive work**: Higher-quality models
   (opencode-go/glm-5.1, opencode-go/kimi-k2.6) follow instructions more
   reliably and are less susceptible to prompt injection than free-tier models.
7. **Safe defaults for destructive commands**: Use `--dry-run` flags when
   available. Add explicit confirmation steps in agent prompts for irreversible
   operations.
