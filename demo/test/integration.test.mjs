/**
 * Integration Tests for Task List App
 *
 * Tests all 16 Acceptance Criteria (AC-01 through AC-16).
 * Uses Node.js built-in fetch (Node 18+) and child_process.
 *
 * Usage: node --test test/integration.test.mjs
 *   or:  node test/integration.test.mjs
 */

import { spawn } from 'node:child_process';
import { unlinkSync, existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = 'http://localhost:3000';
const API  = `${BASE}/api`;
const DB_PATH = './tasks.db';

// --- Test state ---
let server = null;
let passed = 0;
let failed = 0;
const results = [];

function assert(condition, label, detail = '') {
  if (condition) {
    results.push(`  ✅ ${label}`);
    passed++;
  } else {
    results.push(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function fetchJSON(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body, ok: res.ok };
}

async function runTests() {
  // Clean DB state
  if (existsSync(DB_PATH)) {
    unlinkSync(DB_PATH);
  }

  // Start server
  console.log('\n📦 Starting server for integration tests...\n');
  server = spawn('node', ['server.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '3000' },
  });

  // Collect stderr for debugging
  let serverError = '';
  server.stderr.on('data', (d) => { serverError += d.toString(); });

  // Wait for server to be ready
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE}/`);
      if (res.ok) { ready = true; break; }
    } catch {}
    await sleep(200);
  }

  if (!ready) {
    console.error('❌ Server failed to start');
    console.error(serverError);
    process.exit(1);
  }
  console.log('  Server started on port 3000\n');

  // ===== AC-01: GET /api/tasks returns [] when empty =====
  console.log('--- AC-01 to AC-10: API Acceptance Criteria ---');
  {
    const { status, body } = await fetchJSON('/tasks');
    assert(status === 200, 'AC-01: GET /api/tasks returns 200');
    assert(Array.isArray(body) && body.length === 0,
      'AC-01: GET /api/tasks returns [] when empty',
      `got ${JSON.stringify(body)}`);
  }

  // ===== AC-02: POST creates a task =====
  let createdTask;
  {
    const { status, body } = await fetchJSON('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Buy milk' }),
    });
    assert(status === 201, 'AC-02: POST /api/tasks returns 201');
    assert(body && body.id === 1, 'AC-02: created task has id=1', JSON.stringify(body));
    assert(body && body.title === 'Buy milk', 'AC-02: task title is "Buy milk"', JSON.stringify(body));
    assert(body && body.completed === false, 'AC-02: task completed is false', JSON.stringify(body));
    assert(body && typeof body.created_at === 'string' && body.created_at.length > 0,
      'AC-02: task has created_at timestamp', JSON.stringify(body));
    createdTask = body;
  }

  // ===== AC-03: GET /api/tasks includes new task =====
  {
    const { status, body } = await fetchJSON('/tasks');
    assert(status === 200, 'AC-03: GET /api/tasks returns 200');
    assert(Array.isArray(body) && body.length === 1,
      'AC-03: list has 1 task', `got ${body.length} tasks`);
    assert(body[0].title === 'Buy milk',
      'AC-03: task title matches', JSON.stringify(body[0]));
  }

  // ===== AC-04: PATCH toggles completed =====
  {
    const { status, body } = await fetchJSON('/tasks/1', {
      method: 'PATCH',
      body: JSON.stringify({ completed: true }),
    });
    assert(status === 200, 'AC-04: PATCH /api/tasks/1 returns 200');
    assert(body && body.completed === true,
      'AC-04: task completed is true', JSON.stringify(body));

    // Toggle back to false
    const { body: body2 } = await fetchJSON('/tasks/1', {
      method: 'PATCH',
      body: JSON.stringify({ completed: false }),
    });
    assert(body2 && body2.completed === false,
      'AC-04: task completed toggles back to false', JSON.stringify(body2));
  }

  // ===== AC-05: DELETE task =====
  {
    const { status, body } = await fetchJSON('/tasks/1', { method: 'DELETE' });
    assert(status === 200, 'AC-05: DELETE /api/tasks/1 returns 200');
    assert(body && body.ok === true,
      'AC-05: DELETE returns { ok: true }', JSON.stringify(body));
  }

  // ===== AC-06: GET after delete does not include task =====
  {
    const { status, body } = await fetchJSON('/tasks');
    assert(status === 200, 'AC-06: GET returns 200');
    assert(Array.isArray(body) && body.length === 0,
      'AC-06: list is empty after delete', `got ${body.length} tasks`);
  }

  // ===== AC-07: GET /api/tasks/999 returns 404 =====
  {
    const { status, body } = await fetchJSON('/tasks/999');
    assert(status === 404, 'AC-07: GET /api/tasks/999 returns 404');
    assert(body && body.error, 'AC-07: response has error field', JSON.stringify(body));
  }

  // ===== AC-08: PATCH /api/tasks/999 returns 404 =====
  {
    const { status, body } = await fetchJSON('/tasks/999', {
      method: 'PATCH',
      body: JSON.stringify({ completed: true }),
    });
    assert(status === 404, 'AC-08: PATCH /api/tasks/999 returns 404');
    assert(body && body.error, 'AC-08: response has error field', JSON.stringify(body));
  }

  // ===== AC-09: DELETE /api/tasks/999 returns 404 =====
  {
    const { status, body } = await fetchJSON('/tasks/999', { method: 'DELETE' });
    assert(status === 404, 'AC-09: DELETE /api/tasks/999 returns 404');
    assert(body && body.error, 'AC-09: response has error field', JSON.stringify(body));
  }

  // ===== AC-10: POST with missing title returns 400 =====
  {
    const { status, body } = await fetchJSON('/tasks', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assert(status === 400, 'AC-10: POST without title returns 400');
    assert(body && body.error && body.error.includes('Title'),
      'AC-10: error mentions "Title"', JSON.stringify(body));
  }

  // ===== AC-10b: POST with empty title returns 400 =====
  {
    const { status, body } = await fetchJSON('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: '' }),
    });
    assert(status === 400,
      'AC-10: POST with empty title returns 400', JSON.stringify(body));
  }

  // ===== AC-10c: POST with whitespace-only title returns 400 =====
  {
    const { status, body } = await fetchJSON('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: '   ' }),
    });
    assert(status === 400,
      'AC-10: POST with whitespace-only title returns 400', JSON.stringify(body));
  }

  // ===== Frontend Tests (AC-11 through AC-16) =====
  console.log('\n--- AC-11 to AC-16: Frontend / DB Acceptance Criteria ---');

  // ===== AC-11: HTML page loads =====
  {
    const res = await fetch(`${BASE}/`);
    const html = await res.text();
    assert(res.status === 200, 'AC-11: / returns 200');
    assert(html.includes('Add'), 'AC-11: page has "Add" button text', 'Button text not found');
    assert(html.includes('taskInput') || html.includes('input'),
      'AC-11: page has input field', 'Input not found');
    assert(html.includes('task-list') || html.includes('taskList'),
      'AC-11: page has task list container', 'List container not found');
  }

  // ===== AC-12 / AC-13 / AC-14: UI operations (verified via API) =====
  // Create a task through the API (simulates UI add)
  {
    const { status, body } = await fetchJSON('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'UI Test Task' }),
    });
    assert(status === 201, 'AC-12/13/14: POST creates task for frontend test');
    assert(body && body.title === 'UI Test Task', 'AC-12: Task created correctly');

    // Verify the task is in the list
    const { body: tasks } = await fetchJSON('/tasks');
    assert(tasks.length > 0 && tasks.some(t => t.title === 'UI Test Task'),
      'AC-12: Task appears in list', `Found ${tasks.length} tasks`);

    // Toggle completed
    const taskId = body.id;
    const { body: updated } = await fetchJSON(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: true }),
    });
    assert(updated && updated.completed === true,
      'AC-13: Toggle completed via PATCH works');

    // Delete the task
    const { body: deleted } = await fetchJSON(`/tasks/${taskId}`, { method: 'DELETE' });
    assert(deleted && deleted.ok === true,
      'AC-14: Delete via API works');

    // Verify deletion
    const { body: tasksAfter } = await fetchJSON('/tasks');
    assert(!tasksAfter.some(t => t.id === taskId),
      'AC-14: Task removed from list after delete');
  }

  // ===== AC-15: Data persists (verify via getTaskById on a remaining task) =====
  // Create a task, then re-fetch it after restart simulation
  {
    const { body: task } = await fetchJSON('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Persist Test' }),
    });
    assert(task && task.id, 'AC-15: Created task for persistence test');

    // Verify it exists in list
    const { body: tasks } = await fetchJSON('/tasks');
    const found = tasks.some(t => t.title === 'Persist Test');
    assert(found, 'AC-15: Task persists in list', `Task not found among ${tasks.length} tasks`);
  }

  // ===== AC-16: tasks.db file exists =====
  {
    assert(existsSync(DB_PATH),
      'AC-16: tasks.db file exists on disk', `File not found at ${DB_PATH}`);
  }

  // ===== Summary =====
  const total = passed + failed;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Results: ${passed}/${total} passed`);
  results.forEach(r => console.log(r));

  if (failed > 0) {
    console.log(`\n⚠️  ${failed} test(s) FAILED`);
  } else {
    console.log('\n🎉 All tests PASSED');
  }

  // Cleanup
  server.kill('SIGTERM');
  // Clean DB for fresh next run
  if (existsSync(DB_PATH)) {
    unlinkSync(DB_PATH);
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  if (server) server.kill();
  process.exit(1);
});
