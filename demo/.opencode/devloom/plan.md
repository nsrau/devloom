# Implementation Plan

## Architecture Overview
Express server on port 3000 serves a single-page vanilla JS frontend from `public/` and exposes a CRUD REST API backed by SQLite via sql.js. The database layer (`db.js`) encapsulates all sql.js interactions (initialization, schema creation, CRUD operations, file persistence with the export-before-save caveat). The API layer (`server.js`) defines five REST endpoints and wires them to `db.js`. The frontend (`public/index.html`) uses the Fetch API for AJAX calls to render tasks, add new ones, toggle completion, and delete without full page reloads.

## Component Diagram (ASCII)
```
┌─────────────┐     HTTP      ┌──────────────────┐     sql.js API     ┌───────────┐
│   Browser   │ ◄──────────► │   Express App    │ ◄──────────────► │  tasks.db │
│ (index.html)│   REST/JSON   │   (server.js)    │   (db.js)        │ (SQLite)  │
│             │               │                  │                  │           │
│  Fetch API  │               │  GET    /api/tasks                 │           │
│  Vanilla JS │               │  POST   /api/tasks                 │           │
│  Inline CSS │               │  GET    /api/tasks/:id             │           │
└─────────────┘               │  PATCH  /api/tasks/:id             │           │
                              │  DELETE /api/tasks/:id             │           │
                              └──────────────────┘                 └───────────┘
```

## Tasks

- [x] Task 1: Project Scaffolding and Dependency Setup
  - Files: `package.json`, `public/index.html` (stub), `.gitignore`
  - Description: Initialize the Node.js project. Create `package.json` with `express` and `sql.js` as dependencies, add a `start` script. Create `public/index.html` as a minimal stub. Create `.gitignore` with `node_modules/` and `tasks.db`. Run `npm install`. Verify server starts on port 3000 and serves the stub.
  - Acceptance: `npm install` succeeds. `node server.js` starts on port 3000 and `curl http://localhost:3000/` returns the stub HTML with status 200. Server stops cleanly (Ctrl+C or via test harness).

- [x] Task 2: Database Layer — `db.js` with sql.js CRUD Operations
  - Files: `db.js`
  - Description: Create the database module using sql.js. On first call, initialize an in-memory SQLite database, load/create `tasks.db` on disk, and run schema migration. The `tasks` table schema: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `title TEXT NOT NULL`, `completed INTEGER DEFAULT 0`, `created_at TEXT DEFAULT (CURRENT_TIMESTAMP)`. Export the database to `tasks.db` after every write operation (INSERT, UPDATE, DELETE), ensuring `last_insert_rowid()` is read BEFORE calling `db.export()`. Expose functions: `getAllTasks()`, `getTaskById(id)`, `createTask(title)`, `updateTask(id, { completed })`, `deleteTask(id)`. Return plain JS objects with `completed` as boolean.
  - Acceptance: `db.js` is requireable without errors. `getAllTasks()` returns `[]` initially. `createTask("Buy milk")` returns `{ id: 1, title: "Buy milk", completed: false, created_at: "..." }`. `getTaskById(1)` returns that task. `updateTask(1, { completed: true })` returns the updated task with `completed: true`. `deleteTask(1)` returns `true`, and subsequent `getById(1)` returns `null`. `updateTask(999)` and `deleteTask(999)` return `null`. `tasks.db` file is created in the project root after any write.

- [x] Task 3: API Server — Express Routes in `server.js`
  - Files: `server.js`
  - Description: Create the Express server entry point. Import and use `db.js`. Parse JSON request bodies via `express.json()`. Serve static files from `public/`. Define five endpoints: `GET /api/tasks` → list all, `POST /api/tasks` → create (validate `title` is present, return 201), `GET /api/tasks/:id` → get single task (404 if missing), `PATCH /api/tasks/:id` → update completed status (validate body, 404 if missing), `DELETE /api/tasks/:id` → delete (404 if missing, 200 with `{ ok: true }`). Always return proper HTTP status codes (201 for create, 200 for success, 400 for bad input, 404 for not found, 500 for server errors). Format errors as `{ error: "<message>" }`.
  - Acceptance: All 10 API acceptance criteria (AC-01 through AC-10) pass via `curl` against the running server. Specifically: empty list returns `[]`, create returns 201 with correct shape, PATCH inverts completed, DELETE returns `{ ok: true }`, missing task IDs return 404 on GET/PATCH/DELETE, missing title returns 400.

- [x] Task 4: Frontend UI — `public/index.html` with Full Task Management
  - Files: `public/index.html`
  - Description: Replace the stub with a complete single-page application. Inline CSS for clean, minimal styling. Inline vanilla JS that: on page load, fetches `GET /api/tasks` and renders the list (empty state when no tasks); an input field + "Add" button that POSTs a new task via `fetch` and prepends it to the list without page reload; each task row shows a checkbox (toggles completed via PATCH) and a "Delete" button (removes via DELETE). Update the UI optimistically after each mutation. Handle loading and error states (show a simple error message on failure). Order tasks by `created_at` ascending (newest at bottom).
  - Acceptance: AC-11 through AC-16 pass. Browser at `localhost:3000` shows input + "Add" button + task list. Adding a task via UI shows it immediately. Clicking checkbox toggles persisted completed state. Clicking "Delete" removes it from list and DB. Refreshing page reloads all persisted tasks. `tasks.db` file exists after first mutation.

- [x] Task 5: Integration Tests — Automated Verification of All 16 ACs
  - Files: `test/integration.test.mjs`
  - Description: Write an integration test using Node.js built-in `node:test` and `node:assert` (or a simple shell script with `curl`). The test starts the server, runs through all 16 acceptance criteria sequentially, and reports pass/fail for each. Delete `tasks.db` before starting to ensure clean state. Use `child_process` to spawn the server, `fetch` or `http` module to make requests. Test both happy paths (create, read, update, delete) and error paths (missing tasks, bad input). Kill the server and clean up `tasks.db` after tests complete.
  - Acceptance: `node test/integration.test.mjs` exits with code 0, printing each AC and pass/fail status. All 16 ACs pass. No persistent state leaks between test runs.

## Testing Strategy
- **Unit tests** are omitted for this simple app; the integration test covers all acceptance criteria end-to-end.
- **Integration test** (`test/integration.test.mjs`) exercises every API endpoint (AC-01 through AC-10) and indirectly validates the frontend by confirming the DB state persists (AC-16). The frontend acceptance criteria (AC-11 through AC-15) are verified via the test's simulated browser-like interactions or via manual browser check documented in the test output.
- **Manual verification**: AC-11 through AC-15 can be verified by a human opening the browser, but the integration test validates the underlying API contract and DB state that the frontend depends on.

## Rollout Plan
- No migration steps needed — the schema is auto-created on first database initialization.
- No environment variables required. Port 3000 is hardcoded per requirements.
- The `tasks.db` file is created automatically in the project root. It should be added to `.gitignore` to prevent committing test/development data.
- Deployment: `npm start` (runs `node server.js`). Ensure Node.js 24+ is available.
