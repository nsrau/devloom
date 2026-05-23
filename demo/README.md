# Demo: Task List App — Built with DevLoom

This folder is a full-stack Task List web app generated entirely by [**DevLoom**](https://github.com/anomalyco/devloom), an autonomous multi-agent software development system built on top of OpenCode.

## Prompt Used

```
/devloom Build a very simple full-stack Task List web app.
```

## Tech Stack

- **Backend:** Node.js + Express + sql.js (SQLite via WebAssembly)
- **Frontend:** Vanilla HTML/CSS/JS (single page, no frameworks)
- **Persistence:** SQLite database (`tasks.db`)

## How DevLoom Built It

DevLoom analyzed the requirements, planned the architecture, and implemented the app across 5 tasks:

1. Project scaffolding (Express + sql.js setup)
2. Database layer with CRUD operations
3. REST API server with 5 endpoints
4. Single-page frontend UI
5. Integration tests (16 acceptance criteria)

All work was done autonomously by DevLoom's agents (analyst, architect, developer, QA) using an orchestrator workflow.

## Run It

```bash
npm install
npm start
```

Open http://localhost:3000 in your browser.
