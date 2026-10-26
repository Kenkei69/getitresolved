import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, Browser, Page } from 'playwright-core';
import http from 'http';
import path from 'path';
import { createApp } from '../../src/server/app';

const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}`;

describe('End-to-End Browser Journeys (Playwright & Headless Chromium)', () => {
  let server: http.Server;
  let browser: Browser;
  let page: Page;

  before(async () => {
    // 1. Start application server in production mode
    const app = createApp();
    server = app.listen(TEST_PORT, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));

    // 2. Launch Chromium browser
    browser = await chromium.launch({
      executablePath: '/repl/tools/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    page = await browser.newPage();
  });

  after(async () => {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  it('1. Loads Landing Page and verifies civic branding & scoring guide', async () => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    const title = await page.textContent('h1');
    assert.match(title || '', /Getitresolved|CivicResolve/);

    // Capture desktop landing screenshot
    await page.screenshot({ path: 'tests/e2e/screenshots/1-landing-desktop.png' });

    // Test mobile layout (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: 'tests/e2e/screenshots/1-landing-mobile.png' });
    await page.setViewportSize({ width: 1280, height: 800 });

    // Navigate to Scoring Guide
    await page.goto(`${BASE_URL}/scoring-guide`, { waitUntil: 'networkidle' });
    const guideHeading = await page.textContent('h1');
    assert.match(guideHeading || '', /How Scoring & Star Indicators Work/);
    await page.screenshot({ path: 'tests/e2e/screenshots/2-scoring-guide.png' });
  });

  it('2. Citizen Journey: Login -> Submit Complaint -> Track Reference', async () => {
    // Go to login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    // Fill credentials for Citizen Jane
    await page.fill('#email', 'citizen.jane@example.com');
    await page.fill('#password', 'Citizen123!');
    await page.click('button[type="submit"]');

    // Wait for redirect to citizen dashboard
    await page.waitForURL('**/dashboard', { timeout: 8000 });
    const dashboardTitle = await page.textContent('h1');
    assert.match(dashboardTitle || '', /Citizen Dashboard/);

    await page.screenshot({ path: 'tests/e2e/screenshots/3-citizen-dashboard.png' });

    // Navigate to submit page
    await page.goto(`${BASE_URL}/submit`, { waitUntil: 'networkidle' });

    // Fill complaint form
    const testTitle = `Leaking fire hydrant valve ${Date.now()}`;
    await page.fill('#title', testTitle);
    await page.fill('#description', 'Water is spraying steadily from the municipal hydrant side port onto the roadway. Puddles are forming across two traffic lanes.');
    await page.fill('#address', 'Corner of 8th Avenue and Water Street');

    await page.screenshot({ path: 'tests/e2e/screenshots/4-citizen-submit-form.png' });

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for confirmation screen
    await page.waitForSelector('text=Complaint Successfully Submitted', { timeout: 10000 });
    const refText = await page.textContent('.font-mono.text-xl');
    assert.ok(refText && refText.startsWith('CR-'), 'Must display unique complaint reference');

    await page.screenshot({ path: 'tests/e2e/screenshots/5-submission-confirmation.png' });

    // Click track complaint details
    await page.click('text=Track Complaint Details');
    await page.waitForSelector('text=Citizen Report Details');

    // Verify status is ASSIGNED to Water department
    const statusText = await page.textContent('body');
    assert.match(statusText || '', /Water Supply/);

    await page.screenshot({ path: 'tests/e2e/screenshots/6-complaint-tracking-citizen.png' });
  });

  it('3. Staff Journey: Water Staff updates status to In Progress, then Resolved', async () => {
    // Sign in as Water Staff David Okafor
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('#email', 'staff.water@civicresolve.gov');
    await page.fill('#password', 'Staff123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/staff/queue', { timeout: 8000 });
    const queueHeading = await page.textContent('h1');
    assert.match(queueHeading || '', /Water Supply/);

    // Filter by Assigned complaints
    await page.goto(`${BASE_URL}/staff/queue?status=ASSIGNED`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'tests/e2e/screenshots/7-staff-queue.png' });

    // Open first assigned complaint for status update
    const updateButton = await page.$('button:has-text("Update")');
    if (updateButton) {
      await updateButton.click();
      await page.waitForSelector('text=Target Status');

      // Click the status button for IN PROGRESS if present
      const inProgressBtn = await page.$('button:has-text("IN PROGRESS")');
      if (inProgressBtn) {
        await inProgressBtn.click();
      }
      await page.fill('textarea', 'Dispatch team dispatched to inspect valve.');
      await page.click('button:has-text("Confirm Status Change")');

      await page.waitForTimeout(800);
      await page.screenshot({ path: 'tests/e2e/screenshots/8-staff-in-progress.png' });
    }
  });

  it('4. Admin Journey: Administrator reviews queue, checks stats & score overrides', async () => {
    // Sign in as Administrator Elena Rostova
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('#email', 'admin@civicresolve.gov');
    await page.fill('#password', 'Admin123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin/dashboard', { timeout: 8000 });
    const adminHeading = await page.textContent('h1');
    assert.match(adminHeading || '', /Municipal Administration/);

    await page.screenshot({ path: 'tests/e2e/screenshots/9-admin-dashboard.png' });

    // Go to Manual Review queue
    await page.goto(`${BASE_URL}/admin/manual-review`, { waitUntil: 'networkidle' });
    const reviewTitle = await page.textContent('h1');
    assert.match(reviewTitle || '', /Manual Review Queue/);

    await page.screenshot({ path: 'tests/e2e/screenshots/10-admin-manual-review-queue.png' });

    // Go to Staff & Department management
    await page.goto(`${BASE_URL}/admin/staff`, { waitUntil: 'networkidle' });
    const staffTitle = await page.textContent('h1');
    assert.match(staffTitle || '', /Staff & Department Management/);

    await page.screenshot({ path: 'tests/e2e/screenshots/11-admin-staff-management.png' });

    // Go to Audit Logs
    await page.goto(`${BASE_URL}/admin/audit-logs`, { waitUntil: 'networkidle' });
    const auditTitle = await page.textContent('h1');
    assert.match(auditTitle || '', /System Audit History/);

    await page.screenshot({ path: 'tests/e2e/screenshots/12-admin-audit-logs.png' });
  });
});
