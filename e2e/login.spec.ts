import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Authentication & Login E2E Suite', () => {
  test('should render the login card and form elements', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.cardTitle).toBeVisible();
    await expect(loginPage.cardDescription).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('should display an error alert when credentials are invalid (401)', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Credenciales inválidas' }),
      });
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('wrong@condo.com', 'invalid-password');

    await expect(loginPage.errorAlert).toBeVisible();
    await loginPage.expectErrorMessage('Credenciales inválidas');
  });

  test('should authenticate and redirect ADMIN_CONDOMINIO to /dashboard (200)', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'fake-jwt',
          user: {
            id: '1',
            email: 'admin@condo.com',
            nombre_completo: 'Admin Demo',
            rol: 'ADMIN_CONDOMINIO',
            condominio_id: 'condo-1',
          },
        }),
      });
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin@condo.com', 'Password123!');

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('should automatically redirect from root landing (/) to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
  });
});
