process.env.NODE_ENV = 'test';
import { chromium, Browser, Page } from 'playwright-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { createApp } from '../../src/server/app';

const PORT = 5088;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOT_DIR = path.resolve('tests/e2e/screenshots');

async function main() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const app = createApp();
  const server = app.listen(PORT, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  const browser = await chromium.launch({
    executablePath: '/repl/tools/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('1. Capturing Landing Page...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-1-landing-1440.png'), fullPage: false });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-1-landing-375.png'), fullPage: false });

  console.log('2. Capturing Scoring Guide...');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/scoring-guide`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-2-scoring-guide.png') });

  console.log('3. Capturing Login & Register...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-3-login.png') });

  await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-4-register.png') });

  console.log('4. Capturing Citizen Dashboard & Submit Form...');
  // Log in as Citizen
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', 'citizen.jane@example.com');
  await page.fill('#password', 'Citizen123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await page.waitForSelector('table tbody tr, text=No complaints', { timeout: 5000 }).catch(() => {});

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-5-citizen-dashboard-1440.png') });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-5-citizen-dashboard-375.png') });

  // Submit Complaint form
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/submit`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-6-submit-form.png') });

  console.log('5. Capturing Complaint Details...');
  // Navigate to an existing complaint
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForSelector('a[href^="/complaints/"]', { timeout: 5000 }).catch(() => {});
  const detailLink = await page.$('a[href^="/complaints/"]');
  if (detailLink) {
    const href = await detailLink.getAttribute('href');
    if (href) {
      await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-7-complaint-detail.png') });
    }
  }

  console.log('6. Capturing Staff Dashboard...');
  // Log in as Staff
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', 'staff.water@civicresolve.gov');
  await page.fill('#password', 'Staff123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/staff/queue');
  await page.waitForSelector('table tbody tr', { timeout: 5000 }).catch(() => {});
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-8-staff-queue.png') });

  console.log('7. Capturing Admin Workflows...');
  // Log in as Admin
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', 'admin@civicresolve.gov');
  await page.fill('#password', 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/dashboard');
  await page.waitForSelector('table tbody tr', { timeout: 5000 }).catch(() => {});
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-9-admin-dashboard.png') });

  await page.goto(`${BASE_URL}/admin/manual-review`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-10-manual-review.png') });

  await page.goto(`${BASE_URL}/admin/staff`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-11-admin-staff.png') });

  await page.goto(`${BASE_URL}/admin/audit-logs`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-12-audit-logs.png') });

  console.log('8. Capturing Privacy Policy and Support...');
  await page.goto(`${BASE_URL}/privacy`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-14-privacy-policy.png') });

  await page.goto(`${BASE_URL}/support`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-15-support.png') });

  console.log('9. Capturing 404 Page...');
  await page.goto(`${BASE_URL}/non-existent-page-test-404`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'polish-13-not-found-404.png') });

  await browser.close();
  await new Promise((resolve) => server.close(resolve));

  console.log('All screenshots captured successfully.');
  if (consoleErrors.length > 0) {
    console.warn('Console errors encountered:', consoleErrors);
  } else {
    console.log('Zero console errors encountered across all page captures!');
  }
}

main().catch((err) => {
  console.error('Capture script failed:', err);
  process.exit(1);
});
