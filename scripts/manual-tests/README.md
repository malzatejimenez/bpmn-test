# Manual Tests

This directory contains manual test scripts used during development for debugging and testing specific features.

## Running Manual Tests

These scripts use Playwright to open a browser and test specific functionality:

```bash
node scripts/manual-tests/test-constructor.js
```

## Available Tests

- `test-auto-layout.js` - Test auto-layout functionality
- `test-constructor.js` - Test BPMN constructor
- `test-debug.js` - General debugging script
- `test-debug-detailed.js` - Detailed debugging script
- `test-drag-drop-simple.js` - Test drag and drop functionality
- `test-full-persistence.js` - Test full persistence flow
- `test-modeler.js` - Test BPMN modeler component
- `test-persistence.js` - Test data persistence
- `test-persistence-simple.js` - Simple persistence test
- `test-preserve-changes.js` - Test change preservation
- `test-relayout.js` - Test diagram re-layout
- `test-view-switcher.js` - Test view switching functionality
- `test-view-switcher-fix.js` - Test view switcher fixes

## Note

These are development scripts and are not part of the automated test suite. For automated tests, see:
- Unit tests: `src/**/*.test.ts`
- E2E tests: `e2e/**/*.spec.ts`
