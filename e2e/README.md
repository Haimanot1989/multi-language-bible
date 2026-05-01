# E2E Tests

This folder contains Playwright end-to-end tests.

## Run

```bash
npm run test:e2e
```

## Headed mode

```bash
npm run test:e2e:headed
```

## Notes

- Tests start the app automatically through `playwright.config.ts`.
- Make sure search indexes are generated (`npm run build:search-index`) if data has changed.

