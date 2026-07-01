# Chrome Message Contracts

This extension uses `chrome.runtime.sendMessage` to coordinate content scripts, the background service worker, and the offscreen document. Type definitions live mainly in `src/js/types.d.ts`; runtime handlers are registered in `src/background.ts` and `src/js/offscreen.ts`.

## Background Service Worker Messages

Handled by `src/background.ts`.

| Message type | Typical sender | Handler | Payload | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `generateCorrespondence` | `src/js/DebtorObligationsSummary.tsx` | `handleGenerateCorrespondence` | `data.obligations`, `data.VIEWEnvironment`, `data.documentTemplateProperties`, optional `data.targetFields`, optional `data.debtorId` | `{ response }` where `response` is generated correspondence output or an error string | Validates third-party recipient details before scraping. Creates `html/offscreen.html`, scrapes obligations, then sends `prepareCorrespondenceData`. |
| `generateXLSX` | Content/table UI | `handleGenerateXLSX` | `data.obligations`, `data.VIEWEnvironment`, optional `data.exportColumns` | `{ response }` on success or `{ type: "error", error }` | Scrapes target fields, flattens debtor data onto obligation rows, then calls `table(...)` to download an XLSX file. |
| `WDPPreviewInitialise` | `src/js/WDPAutomator.ts` | `handleWDPPreview()` | `data.obligations`, `data.VIEWEnvironment` | `{ type: "success", data }` or `{ type: "error", error }` | Delegates to offscreen `WDPPreviewProcess`. |
| `WDPBatchProcess` | `src/js/WDPAutomator.ts` | `handleWDPProcess()` | Scraper input data, including obligations and environment | `{ type: "success", data: [CollectedData] }` or `{ type: "error", error }` | Runs the standard obligation scraper for WDP batch processing. |
| `bulkAction` | `src/js/DebtorObligationsSummary.tsx` | `bulkAction` | `data.obligations`, `data.VIEWEnvironment`, optional `data.subType` | `{ type: "success", data }` or `{ type: "error", error }` | Opens a popup VIEW bulk update page, marks the tab as a bulk-action popup, and delegates processing to offscreen `processBulkAction`. |
| `getStorage` | Shared UI/content modules | `handleChromeStorage` | `data.key` | `{ success: true, value }` | Reads `chrome.storage.local`. Missing keys return `value: undefined`. |
| `setStorage` | Shared UI/content modules | `handleChromeStorage` | `data.key`, `data.value` | `{ success: true }` | Writes `chrome.storage.local`. |
| `isBulkActionPopup` | `src/js/bulkWriteoffEnhance.js` | `handleBulkActionPopupState` | none | `{ isBulkActionPopup: boolean }` | Checks whether the sender tab was opened by the bulk action flow. |
| `fetchJSON` | Modules needing privileged/cross-origin fetch | `handleBackgroundFetch` | `data` is the `fetch(...)` parameter tuple | Parsed JSON body | Uses `customFetch(...)` and returns `response.json()`. |
| `fetchBase64` | Modules needing privileged/cross-origin binary fetch | `handleBackgroundFetch` | `data` is the `fetch(...)` parameter tuple | Base64 data URL or `{ error }` | Reads the response blob with `FileReader.readAsDataURL`. |

## Offscreen Document Messages

Handled by `src/js/offscreen.ts` after `src/background.ts` creates `html/offscreen.html`.

| Message type | Typical sender | Handler | Payload | Response | Notes |
| --- | --- | --- | --- | --- | --- |
| `obligationScrapeInitialise` | `src/background.ts` | `handleScraper` | `data.obligations`, optional `data.targetFields`, optional `data.VIEWEnvironment` | `CollectedData` or `{ error }` | Calls `getData(...)` from `src/js/scraper.ts`. Uses a `scraperActive` guard to avoid concurrent scrape runs. |
| `prepareCorrespondenceData` | `src/background.ts` | `prepareCorrespondenceData` | `data.dataSet`, `data.documentTemplateProperties` | Generated correspondence results or error string | Calls `getCorrespondence(...)`. Requires `dataSet`; missing data returns `DataSet is missing the 'dataSet' property`. |
| `WDPPreviewProcess` | `src/background.ts` | `obligationPreviewProcess` | `data.obligations`, `data.VIEWEnvironment` | `{ type: "success", data }` or `{ type: "error", error }` | Calls `showVIEWInWDP(...)` to prepare VIEW obligation preview data for WDP. |
| `processBulkAction` | `src/background.ts` | `offscreenBulkAction` | `data.properties`, `data.VIEWEnvironment`, `subType` | `{ type: "success", data }` or `{ type: "error", error }` | Calls `VIEWsubmit(...)` in `Bulk Update` mode and serializes the returned document. |

## Content Script Page Messages

These are received directly by content scripts on matched pages.

| Message shape | Receiver | Payload | Effect |
| --- | --- | --- | --- |
| `{ type: "loadPage", url, data }` | `src/js/bulk-actions.ts` and legacy bulk content scripts | Serialized HTML/form payload and target URL | Posts generated bulk update data into the opened VIEW bulk update tab. |
| `{ url, fetchOptions }` | `src/js/contentScriptFetch.js` | URL and fetch options | Performs a fetch in the page context and returns text/status data to the sender. |

## Message Flow Summary

### Correspondence

1. Table UI sends `generateCorrespondence` to the background service worker.
2. Background sends `obligationScrapeInitialise` to offscreen processing.
3. Offscreen returns scraped `CollectedData`.
4. Background sends `prepareCorrespondenceData` to offscreen processing.
5. Offscreen generates document/email outputs and returns the result.

### XLSX Export

1. UI sends `generateXLSX` to the background service worker.
2. Background sends `obligationScrapeInitialise` to offscreen processing.
3. Background flattens the returned data and calls `table(...)` to download the XLSX file.

### Bulk Action

1. Table UI sends `bulkAction` to the background service worker.
2. Background opens the relevant VIEW bulk update page and stores `bulkActionPopupTab:<tabId>`.
3. Background sends `processBulkAction` to offscreen processing.
4. Offscreen returns serialized page data.
5. Background sends `{ type: "loadPage" }` to the popup tab.

### WDP Preview

1. WDP content script sends `WDPPreviewInitialise` to the background service worker.
2. Background sends `WDPPreviewProcess` to offscreen processing.
3. Offscreen returns transformed VIEW data for the WDP UI.
