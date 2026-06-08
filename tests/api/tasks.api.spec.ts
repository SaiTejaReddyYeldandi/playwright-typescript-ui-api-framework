import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueTaskTitle } from '../../utils/testData';

/** These use the `api` fixture, which is pre-authenticated with a bearer token. */
test.describe('Tasks (API)', () => {
  test('GET /api/tasks returns the seeded list', async ({ api }) => {
    const res = await api.get('/api/tasks');
    expect(res.status()).toBe(200);
    const tasks = await res.json();
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBe(2);
  });

  test('full lifecycle: create -> read -> update -> delete', async ({ api }) => {
    const title = uniqueTaskTitle('Lifecycle');

    // CREATE
    const created = await api.post('/api/tasks', { data: { title } });
    expect(created.status()).toBe(201);
    const task = await created.json();
    expect(task).toMatchObject({ title, done: false });
    expect(typeof task.id).toBe('number');

    // READ
    const read = await api.get(`/api/tasks/${task.id}`);
    expect(read.status()).toBe(200);
    expect((await read.json()).title).toBe(title);

    // UPDATE
    const updated = await api.put(`/api/tasks/${task.id}`, { data: { done: true } });
    expect(updated.status()).toBe(200);
    expect((await updated.json()).done).toBe(true);

    // DELETE
    const deleted = await api.delete(`/api/tasks/${task.id}`);
    expect(deleted.status()).toBe(204);

    // CONFIRM GONE
    const gone = await api.get(`/api/tasks/${task.id}`);
    expect(gone.status()).toBe(404);
  });

  test('POST /api/tasks with no title returns 422', async ({ api }) => {
    const res = await api.post('/api/tasks', { data: {} });
    expect(res.status()).toBe(422);
    expect((await res.json()).error).toBe('Title is required');
  });

  test('GET a non-existent task returns 404', async ({ api }) => {
    const res = await api.get('/api/tasks/999999');
    expect(res.status()).toBe(404);
  });

  test('DELETE a non-existent task returns 404', async ({ api }) => {
    const res = await api.delete('/api/tasks/999999');
    expect(res.status()).toBe(404);
  });
});
