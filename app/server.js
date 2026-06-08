/**
 * TaskBoard - a deliberately small app to test against.
 *
 * It is NOT the portfolio piece. The Playwright framework is.
 * This just gives the framework a real UI + real REST API to drive,
 * with the kinds of behaviour QA actually checks: auth, validation,
 * status codes, CRUD, and error cases.
 */
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- in-memory "database" (resets on restart - fine for tests) ---
const VALID_USER = { username: 'demo', password: 'Password123' };
const TOKEN = 'demo-token-abc123'; // fixed fake token keeps tests deterministic
let tasks = [];
let nextId = 1;

function seed() {
  tasks = [
    { id: nextId++, title: 'Write test plan', done: true },
    { id: nextId++, title: 'Automate login flow', done: false },
  ];
}
seed();

// --- auth middleware ---
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token !== TOKEN) {
    return res.status(401).json({ error: 'Unauthorised' });
  }
  next();
}

// --- routes ---
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === VALID_USER.username && password === VALID_USER.password) {
    return res.json({ token: TOKEN, user: { username } });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

// test-only helper so each spec can start from a known state
app.post('/api/reset', (_req, res) => {
  seed();
  res.json({ status: 'reset', count: tasks.length });
});

app.get('/api/tasks', requireAuth, (_req, res) => res.json(tasks));

app.get('/api/tasks/:id', requireAuth, (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const { title } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(422).json({ error: 'Title is required' });
  }
  const task = { id: nextId++, title: title.trim(), done: false };
  tasks.push(task);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', requireAuth, (req, res) => {
  const task = tasks.find((t) => t.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (typeof req.body.title === 'string') task.title = req.body.title.trim();
  if (typeof req.body.done === 'boolean') task.done = req.body.done;
  res.json(task);
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const idx = tasks.findIndex((t) => t.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });
  tasks.splice(idx, 1);
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`TaskBoard running on http://localhost:${PORT}`));
}

module.exports = app;
