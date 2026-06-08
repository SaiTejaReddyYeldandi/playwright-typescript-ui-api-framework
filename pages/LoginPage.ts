import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model: each page exposes locators + actions, never raw selectors
 * in the test. If the UI changes, you fix it here once, not in 20 specs.
 */
export class LoginPage {
  readonly page: Page;
  readonly username: Locator;
  readonly password: Locator;
  readonly loginBtn: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    this.page = page;
    this.username = page.getByTestId('username');
    this.password = page.getByTestId('password');
    this.loginBtn = page.getByTestId('login-btn');
    this.error = page.getByTestId('login-error');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginBtn.click();
  }

  async expectError(message: string) {
    await expect(this.error).toHaveText(message);
  }
}
