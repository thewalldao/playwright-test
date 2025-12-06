import { test, expect, Locator } from '@playwright/test';
import fs from 'fs';
import path from 'path';

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
        log('⚠️  creds.json not found');
        return [];
    }
    return JSON.parse(fs.readFileSync('creds.json', 'utf8'));
}

test.describe('Setup: LinkedIn Authentication', () => {
    const creds = loadCredentials();

    test.beforeAll(() => {
        if (fs.existsSync('run.log')) fs.unlinkSync('run.log');
    });

    creds.forEach((cred) => {
        test(`Login as ${cred.username}`, async ({ browser }) => {
            const context = await browser.newContext();
            const page = await context.newPage();

            try {
                log(`🔐 Logging in ${cred.username}...`);

                await page.goto('https://www.linkedin.com/login', { timeout: 30000 });
                await page.locator("#username").evaluate((input: HTMLInputElement, username) => {
                    input.value = username;
                }, cred.username!);
                await page.locator("#password").evaluate((input: HTMLInputElement, password) => {
                    input.value = password;
                }, cred.password!);
                // await page.fill('#username', cred.username);
                // await page.fill('#password', cred.password);
                await page.click('button[type="submit"]');

                await page.waitForURL('https://www.linkedin.com/feed/', { timeout: 20000 });
                await page.locator("li-icon[type='app-linkedin-bug-color-icon']").waitFor({
                    state: 'visible',
                    timeout: 20000
                });

                log(`✅ ${cred.username} logged in successfully`);

                // Save cookies
                const cookies = await context.cookies();
                const storageDir = path.dirname(cred.storage);
                if (!fs.existsSync(storageDir)) {
                    fs.mkdirSync(storageDir, { recursive: true });
                }
                fs.writeFileSync(cred.storage, JSON.stringify(cookies, null, 2));
                log(`💾 Session saved: ${cred.storage}`);

            } catch (error) {
                log(`❌ Login failed for ${cred.username}: ${error}`);
                throw error;
            } finally {
                await context.close();
            }
        });
    });
});
