# Requirements: Simple Task List Web App

## 1. User Story
As a user, I want to manage a personal task list in the browser so that I can keep track of things I need to do without losing data between page refreshes.

## 2. Functional Requirements
- FR-01: **View tasks** — The app loads and displays all existing tasks on page load, sorted by creation date (newest last).
- FR-02: **Add task** — The user can type a task description into an input field and submit it, persisting the new task to the database.
- FR-03: **Complete task** — The user can mark a task as complete by clicking a checkbox or toggle button. The task's `completed` status is persisted.
- FR-04: **Delete task** — The user can delete a task entirely. The task is removed from the database.
- FR-05: **List all tasks** — A REST endpoint `GET /api/tasks` returns all tasks as JSON.
- FR-06: **Create task via API** — A REST endpoint `POST /api/tasks` accepts `{ "title": "..." }` and returns the created task with its `id`, `title`, `completed`, and `created_at`.
- FR-07: **Update task via API** — A REST endpoint `PATCH /api/tasks/:id` accepts `{ "completed": true/false }` and returns the updated task.
- FR-08: **Delete task via API** — A REST endpoint `DELETE /api/tasks/:id` deletes the task and returns `{ "ok": true }`.

## 3. Non-Functional Requirements
- NFR-01: **Persistence** — All tasks are stored in a SQLite database file (`tasks.db`) using sql.js. Data survives server restart.
- NFR-02: **Frontend-only interaction** — The UI is delivered as a single HTML page (public/index.html) with inline CSS and vanilla JavaScript. No build step or frontend framework.
- NFR-03: **Port** — The server listens on port 3000.
- NFR-04: **Error handling** — API returns appropriate HTTP status codes: 201 for creation, 200 for success, 404 for missing task, 400 for invalid input, 500 for server errors.
- NFR-05: **Idempotent delete** — Deleting an already-deleted task returns 404, not 500.

## 4. Acceptance Criteria
- [ ] AC-01: `GET /api/tasks` returns an empty array `[]` when no tasks exist.
- [ ] AC-02: `POST /api/tasks` with `{"title": "Buy milk"}` returns status 201 and a JSON object with `id`, `title: "Buy milk"`, `completed: false`, and a `created_at` timestamp string.
- [ ] AC-03: After creating a task, `GET /api/tasks` returns an array containing that task.
- [ ] AC-04: `PATCH /api/tasks/1` with `{"completed": true}` returns the task with `completed: true`.
- [ ] AC-05: `DELETE /api/tasks/1` returns `{"ok": true}` with status 200.
- [ ] AC-06: After deleting a task, `GET /api/tasks` no longer includes it.
- [ ] AC-07: `GET /api/tasks/999` returns status 404 (non-existent task).
- [ ] AC-08: `PATCH /api/tasks/999` returns status 404 (non-existent task).
- [ ] AC-09: `DELETE /api/tasks/999` returns status 404 (non-existent task).
- [ ] AC-10: `POST /api/tasks` with empty body or missing `title` returns status 400.
- [ ] AC-11: The browser UI at `/` shows a text input, an "Add" button, and a list of tasks.
- [ ] AC-12: Adding a task via the UI causes it to appear in the list without a full page reload.
- [ ] AC-13: Clicking the checkbox on a task toggles its completed state visually and persists it.
- [ ] AC-14: Clicking a "Delete" button on a task removes it from the list.
- [ ] AC-15: Refreshing the browser page reloads all tasks from the server (data persists).
- [ ] AC-16: The tasks database file (`tasks.db`) is created in the project root on first request.

## 5. Constraints & Dependencies
- **Language/runtime:** Node.js 24 (no node-gyp / Python available — prebuilt binaries only)
- **Web server:** Express 4.x
- **Database:** sql.js (SQLite compiled to WebAssembly, not native bindings)
- **Frontend:** Vanilla HTML + CSS + JS in a single `public/index.html` file. No frameworks.
- **Existing scaffolding:** Server already serves `public/` as static files on port 3000.
- **sql.js caveat:** `db.export()` resets `last_insert_rowid()` to 0 — must read `SELECT last_insert_rowid()` BEFORE calling `save()`. Use `DEFAULT CURRENT_TIMESTAMP` instead of `datetime('now')`.

## 6. Open Questions
- Q1: Should tasks support a due date or priority? (Out of scope for "very simple" — defer.)
- Q2: Should tasks support editing the title after creation? (Not mentioned in prompt — defer.)
- Q3: Should there be any styling requirements or just functional? (Assume clean but minimal styling.)
- Q4: Should tasks be sorted by creation date ascending or descending? (Assume ascending — newest at bottom.)
