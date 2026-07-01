# Toolkit for VIEW

Toolkit for VIEW is a Chrome Manifest V3 extension that adds workflow tools to the VIEW and WDP web applications. It injects page-specific content scripts, scrapes debtor and obligation data, generates correspondence, exports spreadsheets, performs bulk VIEW updates, and helps move selected VIEW obligations into WDP.

## Quick Start

Install dependencies:

```sh
npm install
```

Build the extension into `dist/`:

```sh
npm run build
```

For development builds that rebuild on change:

```sh
npm run watch
```

Load `dist/` as an unpacked extension in Chrome or Chromium.

## Common Commands

- `npm test`: run Jest tests.
- `npm run test:coverage`: run Jest with coverage.
- `npm run typecheck`: run the focused TypeScript type check.
- `npm run build`: create a production webpack build in `dist/`.
- `npm run build:check`: run typecheck and a production-style build without minification.
- `npm run bump`: increment the extension version in `manifest.json`, `package.json`, and `package-lock.json`.
- `npm run upload`: upload the built extension to Chrome Web Store.
- `npm run upload:publish`: upload and publish.
- `npm run deploy`: bump, build, upload, and publish.

For lower-memory build checks, use:

```sh
NODE_OPTIONS=--max-old-space-size=1024 npm run build:check
```

## Architecture

The extension is message-driven. Content scripts run on matched VIEW/WDP pages, gather UI selections or inject controls, and send Chrome runtime messages to the background service worker. The background worker starts offscreen processing when the task needs DOM parsing, document generation, or coordinated multi-page work.

Main runtime pieces:

- `manifest.json`: Chrome extension metadata, permissions, host permissions, content-script matches, background worker, popup, and sandbox/offscreen resources.
- `config/webpack.config.js`: webpack entry points. Each content script and extension page gets its own bundle under `dist/`.
- `src/background.ts`: background service worker and central message router.
- `src/js/offscreen.ts`: hidden extension page handlers for scraping, correspondence generation, WDP preview work, and bulk action processing.
- `src/js/scraper.ts`: configurable VIEW scraping engine.
- `src/js/config.ts`: field registry, derivation rules, default target fields, XLSX export columns, and page definitions.
- `src/js/DebtorObligationsSummary.tsx`: React/TanStack table UI injected into debtor obligation summary pages.
- `src/js/correspondence.ts`: transforms selected data into debtor/agency correspondence records and generates document/email outputs.
- `src/js/WDPAutomator.ts`: WDP page enhancement and submission flow.

See `docs/message-contracts.md` for the Chrome runtime message map.

## Source Layout

- `src/js/`: content scripts, scraping logic, page automation, correspondence, exports, and shared utilities.
- `src/popup/`: extension popup and utilities page.
- `src/html/`: offscreen, wizard, bulk action, and document generator HTML pages copied into `dist/`.
- `src/css/`: extension styles copied or bundled by webpack.
- `src/__tests__/`: Jest tests.
- `docs/`: project documentation, release notes, and message contracts.
- `scripts/`: release automation helpers.
- `dist/`: generated extension output. Do not edit this directly.
- `coverage/`: generated Jest coverage output.

## Core Workflows

### Scrape VIEW Data

1. A content script sends a message such as `obligationScrapeInitialise` or `generateXLSX`.
2. `src/background.ts` creates `html/offscreen.html` if needed.
3. `src/js/offscreen.ts` calls `getData(...)` from `src/js/scraper.ts`.
4. `src/js/scraper.ts` uses `pageDefinitions`, `allDataFields`, and derivation rules from `src/js/config.ts` to fetch pages and normalize data.

### Generate Correspondence

1. `src/js/DebtorObligationsSummary.tsx` collects selected obligation rows and template options.
2. It sends `generateCorrespondence` to `src/background.ts`.
3. The background worker scrapes required data, then sends `prepareCorrespondenceData` to offscreen processing.
4. `src/js/correspondence.ts` builds debtor or agency records, fetches templates, and uses `src/html/doc-generator.html` to generate `.docx` or `.eml` files.

See `docs/correspondence-flow.md` for the maintainer guide to workbook configuration, Chrome messages, third-party recipient handling, and common failure points.

### Bulk VIEW Updates

1. The table UI sends a `bulkAction` message with selected obligations and a subtype.
2. `src/background.ts` opens the relevant VIEW bulk update page in a popup window.
3. Offscreen processing runs `VIEWSubmit` in bulk update mode.
4. The generated page payload is posted into the popup tab.

### WDP Automation

1. `src/js/WDPAutomator.ts` injects controls into WDP pages.
2. It requests VIEW obligation preview data through the background worker.
3. It submits selected command payloads to WDP APIs.

## Configuration Data

`src/js/config.ts` is the main business configuration file. It defines:

- field names and levels, such as debtor-level and obligation-level fields
- default fields requested by common flows
- derived fields, such as formatted names and addresses
- XLSX export column metadata
- page definitions and selectors used by the scraper
- agency lookup behavior backed by the configured workbook URL

`CONFIG_WORKBOOK_URL` is injected at build time by `config/webpack.config.js`.

## Testing

Run all tests:

```sh
npm test
```

Run one suite:

```sh
npm test -- src/__tests__/correspondence.test.ts --runInBand
```

Current tests focus on correspondence transformation, offscreen error handling, config consistency, and shared storage utilities.

## Release

This project is published through Chrome Web Store. See `docs/release.md` for credential setup, build checks, smoke testing, version bumping, upload, and publish steps.

The `.env` file is ignored by git and must not be committed. Start from `.env.example` when setting up Chrome Web Store credentials.
