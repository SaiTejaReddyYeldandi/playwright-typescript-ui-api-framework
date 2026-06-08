import { Page, Locator, expect } from '@playwright/test';

export class TasksPage {
  readonly page: Page;
  readonly who: Locator;
  readonly newTask: Locator;
  readonly addBtn: Locator;
  readonly taskList: Locator;
  readonly taskError: Locator;
  readonly logoutBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.who = page.getByTestId('who');
    this.newTask = page.getByTestId('new-task');
    this.addBtn = page.getByTestId('add-btn');
    this.taskList = page.getByTestId('task-list');
    this.taskError = page.getByTestId('task-error');
    this.logoutBtn = page.getByTestId('logout-btn');
  }

  /** A task row found by its visible title - resilient to changing ids. */
  taskByTitle(title: string): Locator {
    return this.taskList.locator('.task', { hasText: title });
  }

  async addTask(title: string) {
    await this.newTask.fill(title);
    await this.addBtn.click();
  }

  async deleteTask(title: string) {
    await this.taskByTitle(title).getByRole('button', { name: 'Delete' }).click();
  }

  async toggleTask(title: string) {
    await this.taskByTitle(title).getByRole('checkbox').click();
  }

  async expectTaskVisible(title: string) {
    await expect(this.taskByTitle(title)).toBeVisible();
  }

  async expectTaskCount(count: number) {
    await expect(this.taskList.locator('.task')).toHaveCount(count);
  }
}
