import { expect, test } from '@playwright/test';

test('starts, captures, and stops a webcam stream in a real browser', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByLabel('Camera status')).toHaveText('ready');
  await expect(page.getByLabel('Camera preview')).toHaveJSProperty('videoWidth', 640);

  await page.getByRole('button', { name: 'Capture' }).click();
  await expect(page.getByLabel('Capture result')).toHaveText('captured');

  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByLabel('Camera status')).toHaveText('stopped');
  await expect(page.getByLabel('Camera preview')).toHaveJSProperty('srcObject', null);
});
