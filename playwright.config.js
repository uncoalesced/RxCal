// privacy: production build via `vite preview`. eval: dev server, so specs can import src/engine directly.
// Set PW_CHANNEL=chrome (or msedge) to use an installed browser instead of `npx playwright install chromium`.
import { defineConfig } from '@playwright/test';

const channel = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: 'e2e',
  timeout: 180_000,
  reporter: 'list',
  projects: [
    { name: 'privacy', testMatch: 'privacy.spec.js', use: { baseURL: 'http://localhost:4173', channel } },
    { name: 'eval', testMatch: 'eval.spec.js', use: { baseURL: 'http://localhost:5174', channel } },
  ],
  webServer: [
    { command: 'npm run build && npx vite preview --port 4173 --strictPort', port: 4173, reuseExistingServer: true, timeout: 120_000 },
    { command: 'npx vite --port 5174 --strictPort', port: 5174, reuseExistingServer: true },
  ],
});
