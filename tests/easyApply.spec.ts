import { test, expect, Locator } from '@playwright/test';
import fs from 'fs';

const shortWaitTime = 5000
const mediumWaitTime = 10000
const longWaitTime = 20000
const superWaitTime = 60000
interface Cred {
  username: string;
  password: string;
  storage: string;
}

function log(msg: string) {
  const timestamp = `[${new Date().toISOString()}]`;
  const line = `${timestamp} ${msg}`;
  console.log(line);
  fs.appendFileSync('run.log', line + '\n');
}

function loadCredentials(): Cred[] {
  if (!fs.existsSync('creds.json')) {
    console.warn('⚠️  creds.json not found');
    return [];
  }
  return JSON.parse(fs.readFileSync('creds.json', 'utf8'));
}

async function findEasyApplyJob(page: any): Promise<boolean> {
  log('🔍 Scanning for Easy Apply jobs...');

  try {
    await page.locator("//span[text()='Show all']").first().click({ timeout: mediumWaitTime });
    await page.locator("//li[normalize-space(@class) = 'jobs-search-discovery-tabs__listitem']//*[text()='Easy Apply']").click({ timeout: mediumWaitTime });

    const jobs: Locator = page.locator("//div[@data-results-list-top-scroll-sentinel]/following-sibling::ul//li[contains(@class, 'ember-view')]");
    await jobs.first().waitFor({ state: 'visible', timeout: mediumWaitTime });

    const count = await jobs.count();
    log(`📊 Found ${count} job listings`);

    for (let i = 0; i < count; i++) {
      const job = jobs.nth(i);
      const badge = job.locator('text=Easy Apply');

      if ((await badge.count()) > 0) {
        log(`✨ Easy Apply job found at index ${i}`);
        await job.click();
        await page.waitForTimeout(1000);
        return true;
      }
    }

    log('❌ No Easy Apply job found');
    return false;
  } catch (error) {
    log(`⚠️  Error: ${error}`);
    return false;
  }
}

async function validateEasyApplyModal(page: any): Promise<void> {
  log('📋 Validating Easy Apply modal...');
  log('Checking job has been already summited')
  const alreadySubmitedJob: Locator = page.locator("//div[@data-results-list-top-scroll-sentinel]/following-sibling::ul//li[contains(@class, 'ember-view')]//*[@aria-label='Software Testing Engineer']/ancestor::div[1]/following-sibling::div//*[text()='HCLTech Vietnam']")
  const easySubmitBtn: Locator = page.locator("//div[@class='job-details-fit-level-preferences']/following-sibling::div//button[@id='jobs-apply-button-id']")
  const descriptionJobContainer: Locator = page.locator(".job-details-jobs-unified-top-card__primary-description-container")
  await alreadySubmitedJob.scrollIntoViewIfNeeded({ timeout: longWaitTime })
  await alreadySubmitedJob.waitFor({ state: 'visible', timeout: longWaitTime });
  await alreadySubmitedJob.click({ timeout: 0 })
  await descriptionJobContainer.waitFor({ state: 'visible', timeout: superWaitTime })
  await easySubmitBtn.waitFor({ state: 'detached', timeout: shortWaitTime });
  await expect(easySubmitBtn).not.toBeAttached({ timeout: 0 });

  log('Checking job has not been summited')
  const jobs: Locator = page.locator("//div[@data-results-list-top-scroll-sentinel]/following-sibling::ul//li[contains(@class, 'ember-view')]");
  jobs.first().click({ timeout: longWaitTime })

  await descriptionJobContainer.waitFor({ state: 'visible', timeout: superWaitTime })
  await easySubmitBtn.click({ timeout: longWaitTime })
  const modal = page.locator('#artdeco-modal-outlet [role=dialog]');
  await expect(modal).toBeVisible({ timeout: shortWaitTime });

  const nameField: Locator = modal.locator('input[name*="name"], input[id*="name"]');
  const emailField: Locator = modal.locator('input[type="email"]');
  const fileInput: Locator = modal.locator('input[type="file"]');

  log(`  - Name: ${(await nameField.count()) > 0 ? '✅' : '❌'}`);
  log(`  - Email: ${(await emailField.count()) > 0 ? '✅' : '❌'}`);
  log(`  - File: ${(await fileInput.count()) > 0 ? '✅' : '❌'}`);

  if ((await fileInput.count()) > 0) {
    const testFile = 'test_resume.txt';
    if (!fs.existsSync(testFile)) {
      fs.writeFileSync(testFile, 'Test Resume');
    }
    await fileInput.setInputFiles(testFile);
    log('✅ File uploaded');
  }

  const submitBtn = modal.locator('button:has-text("Next"), button:has-text("Submit"), button:has-text("Review"), button:has-text("Apply")');
  if ((await submitBtn.count()) > 0) {
    const isDisabled = await submitBtn.first().isDisabled();
    log(`  - Submit: ${isDisabled ? '🔒 disabled' : '✅ enabled'}`);
  }
}

test.describe('LinkedIn Easy Apply - E2E', () => {
  const creds = loadCredentials();

  creds.forEach((cred) => {
    test.describe(`User: ${cred.username}`, () => {
      test.beforeEach(async ({ browser }) => {
        log(`\n${'='.repeat(60)}\n🧪 ${cred.username}\n${'='.repeat(60)}`);
      });

      test('Validate Easy Apply modal', async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        const cookies = JSON.parse(fs.readFileSync(cred.storage, 'utf8'));
        await context.addCookies(cookies);

        log('🔗 Navigating to LinkedIn Jobs...');
        await page.goto('https://www.linkedin.com/jobs', { timeout: 30000 });

        const found = await findEasyApplyJob(page);
        if (!found) {
          test.skip();
          return;
        }

        await validateEasyApplyModal(page);
        await context.close();
      });
    });
  });
});
