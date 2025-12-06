# LinkedIn Easy Apply Automation (Playwright — TypeScript)

## Overview
This repository contains a Playwright (TypeScript) test suite that automates 
LinkedIn’s “Easy Apply” workflow up to the final step. 
The script:
- Navigates to LinkedIn Jobs
- Searches for jobs with “Easy Apply”
- Opens the application modal
- Validates required fields: name, email, résumé upload
- Verifies button state (disabled until fields complete)
- Supports Chrome, Edge, and mobile emulation (iPhone, Galaxy)
- Supports multi-user sessions & persistent login (Playwright storage state)

## Install
```bash
npm install
npx playwright install
```

## Run
```bash
npx playwright test
```

## Multi-user run
Put credentials in `creds.json`:
```json
[
  { "username": "user1@example.com", "password": "pass1", "storage": "storage_user1.json" },
  { "username": "user2@example.com", "password": "pass2", "storage": "storage_user2.json" }
]
```

## CI/CD
GitHub Actions workflow included under `.github/workflows/playwright.yml`.

## Note
This script does NOT submit any application. Only validates the flow.
