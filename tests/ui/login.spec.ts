import { test, expect } from '../../fixtures/test-fixtures';
import { VALID_USER, INVALID_USER } from '../../utils/testData';

test.describe('Login (UI)', () => {
  test('valid credentials sign the user in', async ({ loginPage, tasksPage }) => {
    await loginPage.goto();
    await loginPage.login(VALID_USER.username, VALID_USER.password);
    await expect(tasksPage.who).toHaveText(VALID_USER.username);
  });

  test('invalid credentials show an error and stay on login', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(INVALID_USER.username, INVALID_USER.password);
    await loginPage.expectError('Invalid credentials');
    await expect(loginPage.loginBtn).toBeVisible();
  });

  test('logout returns the user to the login screen', async ({ authedPage, tasksPage, loginPage }) => {
    await tasksPage.logoutBtn.click();
    await expect(loginPage.loginBtn).toBeVisible();
  });
});
