# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit 5 application with internationalization (i18n) support via Paraglide.js. The project uses Tailwind CSS 4 for styling and includes both unit and e2e testing.

## Development Commands

```bash
# Development
npm run dev                    # Start dev server
npm run dev -- --open          # Start dev server and open browser

# Building
npm run build                  # Build for production
npm run preview                # Preview production build

# Type Checking
npm run check                  # Run svelte-check once
npm run check:watch            # Run svelte-check in watch mode

# Formatting & Linting
npm run format                 # Format all files with Prettier
npm run lint                   # Check formatting and run ESLint

# Testing
npm test                       # Run all tests (unit + e2e)
npm run test:unit              # Run Vitest unit tests in watch mode
npm run test:unit -- --run     # Run Vitest once
npm run test:e2e               # Run Playwright e2e tests
```

## Architecture

### Internationalization (i18n)

The app uses **Paraglide.js** for internationalization with two locales: `en` (default) and `es`.

- **Message files**: [messages/en.json](messages/en.json) and [messages/es.json](messages/es.json)
- **Generated code**: Auto-generated in [src/lib/paraglide/](src/lib/paraglide/) by the Paraglide Vite plugin
- **Configuration**: [project.inlang/settings.json](project.inlang/settings.json)

**Key implementation details**:

- [hooks.server.ts:4-13](src/hooks.server.ts#L4-L13): Paraglide middleware handles locale detection and sets the `%paraglide.lang%` placeholder in HTML
- [hooks.ts:3](src/hooks.ts#L3): `deLocalizeUrl` reroute removes locale prefixes from URLs for internal routing

### Testing Setup

**Unit Tests** (Vitest with browser mode):

- Configuration in [vite.config.ts:15-43](vite.config.ts#L15-L43)
- Two test projects: `client` (browser environment) and `server` (node environment)
- Client tests: `*.svelte.{test,spec}.{js,ts}` files run in Playwright's Chromium browser
- Server tests: All other `*.{test,spec}.{js,ts}` files run in Node
- Setup file: [vitest-setup-client.ts](vitest-setup-client.ts)

**E2E Tests** (Playwright):

- Configuration in [playwright.config.ts](playwright.config.ts)
- Tests located in `e2e/` directory
- Runs against production build (`npm run build && npm run preview` on port 4173)

### Styling

- **Tailwind CSS 4** configured via Vite plugin in [vite.config.ts:8](vite.config.ts#L8)
- Includes `@tailwindcss/forms` and `@tailwindcss/typography` plugins
- Uses Prettier plugin for automatic class sorting

### Project Structure

```
src/
├── lib/
│   ├── paraglide/        # Auto-generated i18n code
│   ├── assets/           # Static assets
│   └── index.ts          # Public lib exports
├── routes/               # SvelteKit file-based routing
│   ├── +layout.svelte    # Root layout
│   ├── +page.svelte      # Home page
│   └── demo/             # Demo pages
├── hooks.ts              # Client hooks (rerouting)
├── hooks.server.ts       # Server hooks (i18n middleware)
└── app.d.ts              # TypeScript declarations

e2e/                      # Playwright e2e tests
messages/                 # i18n message files
```

## Svelte MCP Server

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

### Available MCP Tools:

**1. list-sections**

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

**2. get-documentation**

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

**3. svelte-autofixer**

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

**4. playground-link**

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

## Notes

- Paraglide code is auto-generated during build/dev - don't edit files in `src/lib/paraglide/` directly
- The project uses `adapter-auto` which will need to be changed for specific deployment targets
- All assertions in tests are required (`expect.requireAssertions: true` in Vitest config)
