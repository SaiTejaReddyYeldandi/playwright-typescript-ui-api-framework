/** Central test data. Keeping it in one place means specs stay readable. */

export const VALID_USER = {
  username: 'demo',
  password: 'Password123',
};

export const INVALID_USER = {
  username: 'demo',
  password: 'wrong-password',
};

/** Unique title per call so parallel tests never collide on data. */
export function uniqueTaskTitle(prefix = 'Task'): string {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
