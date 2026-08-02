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

test('attaches the stream to a preview that mounts after the camera is ready', async ({ page }) => {
  await page.goto('/');

  // The auto-start panel renders its <video> only once status is 'ready', so the element does
  // not exist at the moment the stream is acquired.
  await expect(page.getByLabel('Deferred status')).toHaveText('ready');
  await expect(page.getByLabel('Deferred preview')).toHaveJSProperty('videoWidth', 640);
});

test('stop() keeps an auto-started camera stopped', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByLabel('Deferred status')).toHaveText('ready');
  await expect(page.getByLabel('Deferred acquisitions')).toHaveText('1');

  await page.getByRole('button', { name: 'Halt deferred' }).click();
  await expect(page.getByLabel('Deferred status')).toHaveText('stopped');

  // The restart effect used to fire on the status change and immediately reacquire the camera,
  // leaving the indicator light on. Give it time to misbehave.
  await page.waitForTimeout(1500);

  await expect(page.getByLabel('Deferred status')).toHaveText('stopped');
  await expect(page.getByLabel('Deferred acquisitions')).toHaveText('1');
});

test('restarts on demand after an explicit stop', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByLabel('Deferred status')).toHaveText('ready');
  await page.getByRole('button', { name: 'Halt deferred' }).click();
  await expect(page.getByLabel('Deferred status')).toHaveText('stopped');

  await page.getByRole('button', { name: 'Resume deferred' }).click();
  await expect(page.getByLabel('Deferred status')).toHaveText('ready');
  await expect(page.getByLabel('Deferred acquisitions')).toHaveText('2');
  await expect(page.getByLabel('Deferred preview')).toHaveJSProperty('videoWidth', 640);
});
