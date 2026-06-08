import { test, expect } from '../../fixtures/test-fixtures';
import { request } from '@playwright/test';
import { VALID_USER, INVALID_USER } from '../../utils/testData';

test.describe('Auth (API)', () => {
  test('POST /api/login with valid credentials returns a token', async ({ baseURL }) => {
    const ctx = await request.newContext({ baseURL });
    const res = await ctx.post('/api/login', { data: VALID_USER });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.token).toBeTruthy();
    expect(body.user.username).toBe(VALID_USER.username);
    await ctx.dispose();
  });

  test('POST /api/login with bad credentials returns 401', async ({ baseURL }) => {
    const ctx = await request.newContext({ baseURL });
    const res = await ctx.post('/api/login', { data: INVALID_USER });
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });

  test('GET /api/tasks without a token returns 401', async ({ baseURL }) => {
    const ctx = await request.newContext({ baseURL });
    const res = await ctx.get('/api/tasks');
    expect(res.status()).toBe(401);
    await ctx.dispose();
  });
});
