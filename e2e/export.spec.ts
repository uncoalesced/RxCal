import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('exports a calendar without any request leaving the site', async ({ page, baseURL }) => {
  const foreignRequests: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith(baseURL!) && !url.startsWith('blob:') && !url.startsWith('data:')) {
      foreignRequests.push(url);
    }
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'RxCal' })).toBeVisible();

  // The CSP must be present in the built page.
  const csp = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content');
  expect(csp).toContain("connect-src 'self'");

  await page.getByLabel('Prescription date').fill('2026-09-23');
  await page.getByLabel('Start reminders on').fill('2026-09-24');

  const first = page.getByRole('group', { name: 'Medication 1' });
  await first.getByLabel('Name').fill('Paracetamol 500 mg');
  await first.getByLabel('Dosage').fill('1-0-1');
  await first.getByLabel('Days').fill('5');

  await page.getByRole('button', { name: '+ Add medication' }).click();
  const second = page.getByRole('group', { name: 'Medication 2' });
  await second.getByLabel('Name').fill('Pantoprazole 40 mg');
  await second.getByLabel('Dosage').fill('1-0-0-1');
  await second.getByLabel('Days').fill('3');
  await expect(second.getByText('Morning 1 · Night 1')).toBeVisible();

  await page.getByRole('checkbox', { name: /I have checked/ }).check();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download calendar (.ics)' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('rxcal-2026-09-23.ics');
  const ics = await readFile((await download.path())!, 'utf8');
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(4);
  expect(ics).toContain('DTSTART:20260924T080000');
  expect(ics).toContain('DTSTART:20260924T210000');
  expect(ics.match(/RRULE:FREQ=DAILY;COUNT=5/g)).toHaveLength(2);
  expect(ics.match(/RRULE:FREQ=DAILY;COUNT=3/g)).toHaveLength(2);

  expect(foreignRequests).toEqual([]);
});
