# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Active development |

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
  instructions embedded in prompts. Review agent outputs critically.
- **Network access**: Agents may fetch external resources via `webfetch`.
  Model API calls go through OpenCode's infrastructure.

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
