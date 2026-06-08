import { test, expect } from '../../fixtures/test-fixtures';
import { uniqueTaskTitle } from '../../utils/testData';

test.describe('Tasks (UI)', () => {
  test('seed tasks are listed after login', async ({ authedPage, tasksPage }) => {
    await tasksPage.expectTaskCount(2);
    await tasksPage.expectTaskVisible('Write test plan');
  });

  test('a new task can be added', async ({ authedPage, tasksPage }) => {
    const title = uniqueTaskTitle('Add');
    await tasksPage.addTask(title);
    await tasksPage.expectTaskVisible(title);
    await tasksPage.expectTaskCount(3);
  });

  test('adding an empty task shows a validation error', async ({ authedPage, tasksPage }) => {
    await tasksPage.addTask('');
    await expect(tasksPage.taskError).toHaveText('Title is required');
    await tasksPage.expectTaskCount(2);
  });

  test('a task can be completed (toggled)', async ({ authedPage, tasksPage }) => {
    await tasksPage.toggleTask('Automate login flow');
    await expect(tasksPage.taskByTitle('Automate login flow')).toHaveClass(/done/);
  });

  test('a task can be deleted', async ({ authedPage, tasksPage }) => {
    await tasksPage.deleteTask('Write test plan');
    await expect(tasksPage.taskByTitle('Write test plan')).toHaveCount(0);
    await tasksPage.expectTaskCount(1);
  });

  // Data-driven: same flow, several inputs.
  for (const title of ['Buy milk', 'Fix CI pipeline', 'Review PR #42']) {
    test(`adds task: "${title}"`, async ({ authedPage, tasksPage }) => {
      await tasksPage.addTask(title);
      await tasksPage.expectTaskVisible(title);
    });
  }
});
