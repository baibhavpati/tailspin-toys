import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the correct title', async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle('Tailspin Toys - Crowdfunding your new favorite game!');
  });

  test('should display the main heading', async ({ page }) => {
    // Check that the main page heading is present
    await expect(page.getByRole('heading', { name: 'Welcome to Tailspin Toys', exact: true })).toBeVisible();
  });

  test('should display the site branding in header', async ({ page }) => {
    // Check that the site branding is present in the header (no longer an h1)
    await expect(page.getByText('Tailspin Toys').first()).toBeVisible();
  });

  test('should display the welcome message', async ({ page }) => {
    // Check that the welcome message is present using more specific locator
    await expect(page.getByText('Find your next game! And maybe even back one! Explore our collection!')).toBeVisible();
  });

  test('should filter games by category', async ({ page }) => {
    await test.step('Select a category filter', async () => {
      await page.getByRole('checkbox', { name: 'Strategy' }).check();
      await page.getByTestId('apply-filters').click();
    });

    await test.step('Verify the filtered list', async () => {
      await expect(page.getByTestId('results-summary')).toContainText('Showing 4 games');
      await expect(page.getByTestId('game-card')).toHaveCount(4);
      await expect(page.locator('[data-testid="game-card"]').first()).toContainText('DevOps Dominion');
    });
  });

  test('should combine category and publisher filters', async ({ page }) => {
    await test.step('Apply the combined filters', async () => {
      await page.getByRole('checkbox', { name: 'Strategy' }).check();
      await page.getByLabel('Publisher').selectOption({ label: 'CodeForge Studios' });
      await page.getByTestId('apply-filters').click();
    });

    await test.step('Verify combined filtering', async () => {
      await expect(page.getByTestId('results-summary')).toContainText('Showing 1 game');
      await expect(page.getByTestId('game-card')).toHaveCount(1);
      await expect(page.getByTestId('game-card')).toContainText('DevOps Dominion');
    });
  });
});
