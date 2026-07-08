# Live Docs Fetching

ROLE: fetch current official documentation for external libraries before generating code that uses them — no outdated training data

## When to use (auto-triggered)

- You are about to write code that imports or uses an external library
- You are unsure of the current API surface of a library
- The library version in package.json/requirements.txt/go.mod is newer than your training cutoff
- A user mentions a specific library version or feature

## Process (3 steps max)

1. DETECT: scan the prompt or plan for library/framework names. Check package.json, requirements.txt, go.mod, Cargo.toml for exact versions.
2. FETCH: use `webfetch` to get the official documentation page for the detected library. Prefer:
   - Official docs site (e.g., https://nextjs.org/docs, https://drizzle.team/docs)
   - npm/GitHub README for smaller libraries
   - API reference pages for specific function signatures
3. GROUND: write code using the fetched API surface, not your training data. Cite the doc URL in a comment if the API is non-obvious.

## Rules

- Fetch ONLY when you will actually use the library in code. Do not pre-fetch "just in case" — that wastes tokens.
- One fetch per library per session is enough. Cache the result mentally.
- If the fetch fails or returns irrelevant content, fall back to your training data and flag the uncertainty.
- Never guess API signatures from training data when a fetch is possible — one webfetch is cheaper than debugging wrong API usage.
- Keep fetched context minimal — read the specific API page, not the entire docs site.

## Anti-rationalization

| Excuse | Rebuttal |
|---|---|
| "I know this library from training" | Training data has a cutoff. The version in package.json may be newer. One fetch confirms. |
| "Fetching docs wastes tokens" | Wrong API usage wastes 10x more tokens in debugging. One fetch is cheaper. |
| "The API hasn't changed" | You don't know that without checking. Fetch to confirm. |
| "I'll fix it if the API is wrong" | Prevention is cheaper than repair. Fetch first, code once. |

OUT: code grounded in current official docs, not stale training data
