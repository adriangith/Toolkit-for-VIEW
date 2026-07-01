# Correspondence Flow

This guide documents the current Chrome Manifest V3 correspondence path for maintainers. It covers the practical flow from selected VIEW obligation rows to downloaded `.docx` or `.eml` output, without duplicating implementation details.

## Main Modules

- `src/js/DebtorObligationsSummary.tsx`: table UI, row selection, workbook option lookup, and `generateCorrespondence` sender.
- `src/background.ts`: service worker message router, third-party recipient pre-check, offscreen setup, and scrape/generation orchestration.
- `src/js/offscreen.ts`: hidden document handlers for scraping and correspondence preparation.
- `src/js/scraper.ts`: VIEW page scraper used to collect the requested debtor and obligation fields.
- `src/js/config.ts`: scraper field/page definitions, derived fields, default target fields, workbook URL, and agency lookup helpers.
- `src/js/correspondence.ts`: transforms scraped data into debtor or agency correspondence records and starts generation.
- `src/js/correspondenceTemplateSelection.ts`: validates that workbook-selected correspondence names have matching template rows.
- `src/html/doc-generator.html`: sandbox page that loads both document and email generators.
- `src/js/genLetter-module.ts`: `.docx` generator using Docxtemplater.
- `src/js/email.tsx`: `.eml` generator using Squirrelly and Markdown rendering.

## End-To-End Flow

1. A maintainer-configured option is selected in the debtor obligations table, and the user selects one or more obligation rows.
2. `DebtorObligationsSummary.tsx` reads the configured workbook from `CONFIG_WORKBOOK_URL` and loads:
   - `Options`: maps the selected option description to one or more correspondence names.
   - `Templates`: maps each correspondence name to filename pattern, template link, recipient type, and field set.
   - `FieldSets`: expands field-set names into scraper target fields.
3. `selectTemplatesForOption(...)` ensures every selected correspondence name has a `Templates` row. Missing rows fail before any scraping starts.
4. The table UI builds `targetFields` from template field sets, default fields, and critical fields such as `UserID`, `debtor_id`, `Obligation`, `name`, `dt`, and `Debtor_ID`.
5. The table UI sends `generateCorrespondence` to the background service worker with selected rows, VIEW environment, selected template rows, target fields, and the current debtor id.
6. `background.ts` optionally validates stored third-party recipient details for the debtor, creates `html/offscreen.html`, then sends `obligationScrapeInitialise`.
7. `offscreen.ts` calls `getData(...)` in `scraper.ts`, using requested target fields and the VIEW environment. The scraper returns a `CollectedData` object with debtor-level fields and selected obligations under `a`.
8. `background.ts` sends `prepareCorrespondenceData` to the offscreen document with the scraped data and selected template rows.
9. `correspondence.ts` converts the scraped data into one record per output:
   - Debtor templates produce one record for the selected obligations.
   - Agency templates group obligations by agency `altname`, calculate selected obligation count/value, and produce one record per agency group.
10. For each record, `correspondence.ts` fetches the template link with `?download=1`, determines whether it is a `.docx` document or email template, and loads `doc-generator.html` in a hidden iframe.
11. The iframe receives `generate-document` or `generate-email`, renders the file, posts the result back to the offscreen parent, and `correspondence.ts` downloads the final `.docx` or `.eml` file.

## Chrome Messages

| Message | Sender | Receiver | Purpose |
| --- | --- | --- | --- |
| `generateCorrespondence` | `DebtorObligationsSummary.tsx` | `background.ts` | Starts the flow with selected obligations, template rows, target fields, environment, and debtor id. |
| `obligationScrapeInitialise` | `background.ts` | `offscreen.ts` | Runs the VIEW scraper for the selected obligations and target fields. |
| `prepareCorrespondenceData` | `background.ts` | `offscreen.ts` | Transforms scraped data and generates all requested correspondence outputs. |
| `fetchBase64` | `genLetter-module.ts` | `background.ts` | Fetches embedded image data for document templates when Docxtemplater needs it. |
| `getStorage` | `correspondence.ts` | `background.ts` | Reads stored third-party recipient details by debtor id. |

See `docs/message-contracts.md` for the broader runtime message map.

## Workbook And Template Configuration

`CONFIG_WORKBOOK_URL` is injected at build time by `config/webpack.config.js` and consumed by `src/js/config.ts` and the table UI. The correspondence flow depends on these workbook sheets:

- `Options`: column A is the user-visible option description. Each later column represents a correspondence name; cells set to `TRUE` include that correspondence for the option.
- `Templates`: each row is a `TemplateSheetRecord`. Important columns are `Correspondence`, `Filename`, `Link`, `Recipient`, and `FieldSet`.
- `FieldSets`: maps a field-set token to a whitespace-separated field list. If a template has no `FieldSet`, the flow uses `defaultTargetFields`.
- `Agencies`: used by derived agency fields in `config.ts`, including agency names, addresses, email eligibility, and related lookup values.

Template links must be reachable by the extension and must download as a supported Word or email-template payload. Filename patterns are resolved with scraped record fields by `templateSubstitution(...)`.

## Third-Party Recipient Details

Recipient details are stored in `chrome.storage.local` under the debtor id. When `isThirdParty` is true, both `background.ts` and `correspondence.ts` require the main third-party address to contain at least one populated field.

During transformation, third-party data augments the debtor record with template fields such as `tParty`, `legalCentre`, `recipient`, `applicantName`, `appOrganisation`, address fields, and alternate-address fields. These fields let templates address a third party, legal centre, alternate third party, or the debtor according to Application Options.

## Output Rules

- A template link containing `.docx` is treated as a document and sent to `genLetter-module.ts` with `generate-document`.
- Other template links are treated as email templates and sent to `email.tsx` with `generate-email`.
- `.docx` output is downloaded through `file-saver` as `<correspondenceDescription>.docx`.
- `.eml` output is downloaded through `downloadEmail(...)` as `<correspondenceDescription>.eml`.
- Agency email templates are skipped when the agency data does not have `Email === 'TRUE'` and the filename indicates an email.

## Common Failure Points

- No selected obligation rows or no option selected: the table UI stops before messaging.
- Workbook fetch or parse failure: often caused by SharePoint access, CORS, expired login, missing workbook URL, or malformed sheet headers.
- Missing option/template mapping: `Options` references correspondence names that are absent from `Templates`.
- Invalid template recipient: `Templates.Recipient` must be exactly `Agency` or `Debtor`.
- Missing field sets or fields: unresolved field-set tokens are treated as field names, so typos can become scraper target fields that never populate.
- Empty third-party details: `isThirdParty` requires populated main address details.
- Concurrent scraping: offscreen returns `Scraper is already active.` while another scrape is running.
- Scraper output shape problems: correspondence generation requires a top-level data set with selected obligations under `a`.
- Template fetch/content-type problems: inaccessible links, missing SharePoint permission, non-download URLs, or unsupported content types fail template loading.
- Generation timeout: each hidden iframe generation has a 30 second timeout.
- Template token errors: `.docx` or `.eml` templates can fail if they reference fields that were not scraped or derived.

## Maintenance Notes

- Prefer changing workbook rows before changing code when adding a new correspondence option.
- When a new template needs data not already scraped, add or reuse a `FieldSets` entry and verify the field exists in `src/js/config.ts`.
- Keep `docs/message-contracts.md` in sync when message payloads or response shapes change.
- Avoid editing generated files in `dist/`; update source files and rebuild instead.
