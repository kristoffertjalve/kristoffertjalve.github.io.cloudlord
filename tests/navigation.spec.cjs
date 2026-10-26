const { test, expect } = require('@playwright/test');

const base = 'http://127.0.0.1:8765';

test('estate links, history and About navigation', async ({ page }) => {
  await page.goto(base + '/');
  await page.locator('li[data-estate="tiny-awards"] a').click();
  await expect(page).toHaveURL(/\/estates\/tiny-awards\/$/);
  await expect(page.locator('main h1')).toHaveText('Tinyawards.net');
  await expect(page.locator('li[data-estate="tiny-awards"] a')).toHaveAttribute('aria-current', 'page');
  await page.locator('li[data-about="owner"] a').click();
  await expect(page).toHaveURL(/\/owner\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/estates\/tiny-awards\/$/);
  await expect(page.locator('main h1')).toHaveText('Tinyawards.net');
});

test('links are usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(base + '/');
  await page.locator('li[data-estate="tiny-awards"] a').click();
  await expect(page).toHaveURL(/\/estates\/tiny-awards\/$/);
  await expect(page.locator('main h1')).toHaveText('Tinyawards.net');
  await context.close();
});

test('mobile navigation and return to domains', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(base + '/');
  await page.locator('li[data-estate="tiny-awards"] a').click();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('.mobile-back-link')).toBeVisible();
  await page.locator('.mobile-back-link').click();
  await expect(page).toHaveURL(/#domains$/);
  await expect(page.locator('#domains')).toBeVisible();
  await context.close();
});

test('dark mode remains functional', async ({ page }) => {
  await page.goto(base + '/');
  await page.locator('#dark-mode-toggle').click();
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
  await page.locator('li[data-about="contact"] a').click();
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
});
