# Docs Tests Message Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder project README, add focused regression tests around core correspondence/config logic, and document Chrome message contracts.

**Architecture:** Keep documentation in repository docs/source files only. Add tests to existing Jest suites without changing runtime behavior unless a failing test exposes a small, safe bug.

**Tech Stack:** Chrome Manifest V3, TypeScript, React, webpack, Jest, ts-jest.

## Global Constraints

- Do not commit secrets from `.env`; use `.env.example` only for documented variables.
- Build output lives in `dist/`; source changes belong under `src/`, `docs/`, and root metadata docs.
- Follow the existing Jest setup in `jest.config.js`.
- Use TDD for production-code behavior changes: write failing tests first, verify failure, then implement.

---

### Task 1: README Replacement

**Files:**
- Modify: `README.md`
- Reference: `docs/release.md`
- Reference: `manifest.json`
- Reference: `config/webpack.config.js`

**Interfaces:**
- Consumes: existing scripts from `package.json`.
- Produces: a practical top-level guide for setup, architecture, common workflows, and release pointers.

- [ ] **Step 1: Replace placeholder content**

Write a concise README covering project purpose, architecture, folder map, development commands, loading `dist` as an unpacked extension, and release docs.

- [ ] **Step 2: Verify README references existing commands**

Run: `npm run typecheck`

Expected: command exists and completes or reports existing type errors unrelated to README.

### Task 2: Message Contract Map

**Files:**
- Create: `docs/message-contracts.md`
- Reference: `src/background.ts`
- Reference: `src/js/offscreen.ts`
- Reference: `src/js/types.d.ts`

**Interfaces:**
- Consumes: current Chrome message types and handler names.
- Produces: a human-readable map of message type, sender, handler, payload, response, and notes.

- [ ] **Step 1: Document current message contracts**

Create a table for `generateCorrespondence`, `prepareCorrespondenceData`, `obligationScrapeInitialise`, `generateXLSX`, `WDPPreviewInitialise`, `WDPPreviewProcess`, `WDPBatchProcess`, `bulkAction`, `processBulkAction`, `getStorage`, `setStorage`, `isBulkActionPopup`, `fetchJSON`, and `fetchBase64`.

- [ ] **Step 2: Cross-check against registered listeners**

Run: `npm test -- --runInBand`

Expected: existing tests still pass after docs-only change.

### Task 3: Correspondence Regression Tests

**Files:**
- Modify: `src/__tests__/correspondence.test.ts`
- Potentially modify: `src/js/correspondence.ts`

**Interfaces:**
- Consumes: `transformCorrespondenceDataSet(dataSet, templates)`.
- Produces: tests for third-party recipient data and agency-email filtering.

- [ ] **Step 1: Write failing test for third-party details**

Add a test proving stored third-party details are merged into debtor correspondence data.

- [ ] **Step 2: Run the test to verify RED**

Run: `npm test -- src/__tests__/correspondence.test.ts --runInBand`

Expected: FAIL if behavior is missing, or PASS if existing code already supports it.

- [ ] **Step 3: Write failing test for agency email filtering**

Add a test proving agency email templates are skipped when the agency row has `Email !== 'TRUE'`.

- [ ] **Step 4: Run the test to verify RED**

Run: `npm test -- src/__tests__/correspondence.test.ts --runInBand`

Expected: FAIL if behavior is missing, or PASS if existing code already supports it.

- [ ] **Step 5: Implement minimal fixes only if tests fail for missing behavior**

If tests already pass, do not change production code.

### Task 4: Config Selection Tests

**Files:**
- Create: `src/__tests__/config.test.ts`
- Potentially modify: `src/js/config.ts`

**Interfaces:**
- Consumes: exported config fields from `src/js/config.ts`.
- Produces: tests around default target fields and XLSX export field consistency.

- [ ] **Step 1: Write tests for default/export field consistency**

Assert configured defaults and XLSX export columns reference real field names from the field registry.

- [ ] **Step 2: Run the test to verify RED**

Run: `npm test -- src/__tests__/config.test.ts --runInBand`

Expected: FAIL if required exports are unavailable or configuration is inconsistent.

- [ ] **Step 3: Implement minimal export/config fixes if needed**

Expose only the existing data needed for tests; do not restructure config.

### Task 5: Final Verification

**Files:**
- No new files unless verification exposes needed fixes.

**Interfaces:**
- Consumes: all changes from Tasks 1-4.
- Produces: confidence that docs/tests/build checks are coherent.

- [ ] **Step 1: Run tests**

Run: `npm test -- --runInBand`

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS or clearly report pre-existing unrelated issues.

- [ ] **Step 3: Inspect git diff**

Run: `git diff -- README.md docs src/__tests__ src/js`

Expected: only intended docs/tests/minimal production fixes.

## Self-Review

- Spec coverage: README, tests, and message map are each covered by one task.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: all named files and message types exist in the current codebase.
