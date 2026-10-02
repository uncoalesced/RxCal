// Owner: Joel. Proves the privacy claim: a full scan-confirm-export run makes no request outside our own origin,
// with the production CSP from public/_headers applied (vite preview does not read that file, so we inject it).
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const csp = readFileSync('public/_headers', 'utf8').match(/Content-Security-Policy: (.+)/)[1].trim();

test('scan to export stays on-origin under the production CSP', async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const requests = [];
  context.on('request', (r) => requests.push(r.url()));
  const violations = [];
  page.on('console', (m) => /Content Security Policy/i.test(m.text()) && violations.push(m.text()));

  await page.route('**/*', async (route) => {
    const res = await route.fetch();
    const headers = { ...res.headers() };
    if (route.request().resourceType() === 'document') headers['content-security-policy'] = csp;
    await route.fulfill({ response: res, headers });
  });

  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles('fixtures/rx-02.png');
  await expect(page.getByRole('heading', { name: 'Check every detail' })).toBeVisible({ timeout: 120_000 });

  // The confirm screen must show what the OCR found, and the user must press "Looks right" before export.
  await expect(page.locator('input[type=date]')).toHaveValue('2026-09-14');
  await expect(page.getByRole('group', { name: 'Possible matches' }).first()).toContainText('Pan 40');
  await page.getByRole('button', { name: 'Looks right' }).click();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Add to calendar' }).click();
  const ics = readFileSync(await (await download).path(), 'utf8');
  expect(ics).toContain('BEGIN:VCALENDAR');
  expect(ics).toContain('RRULE:FREQ=DAILY;COUNT=7');

  expect(requests).toContain(`${origin}/tesseract/eng.traineddata.gz`); // OCR data came from us, not a CDN
  const offOrigin = requests.filter((u) => !u.startsWith(origin) && !u.startsWith('blob:') && !u.startsWith('data:'));
  expect(offOrigin).toEqual([]);
  expect(violations).toEqual([]);
});
