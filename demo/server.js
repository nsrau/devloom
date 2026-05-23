const express = require('express');
const db = require('./db');

const app = express();

app.use(express.json());
app.use(express.static('public'));

// GET /api/tasks — list all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await db.getAllTasks();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks — create a task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    const task = await db.createTask(title.trim());
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id — get a single task
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const task = await db.getTaskById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id — update completed status
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { completed } = req.body;
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'completed field must be a boolean' });
    }
    const task = await db.updateTask(id, { completed });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id — delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await db.deleteTask(id);
    if (!result) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
