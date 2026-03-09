# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Delta Chat Desktop is an email-based messaging application. The codebase supports three targets: Electron (primary/production), Tauri (WIP), and Browser (experimental/testing). The frontend is shared across all targets via a runtime abstraction layer.

## Essential Commands

All commands must be run inside a devenv shell. Use `devenv shell CMD -- ARGS` for one-off commands, or enter the shell first with `devenv shell`.

```bash
# Development (Electron)
devenv shell pnpm -- dev                    # Build and start in dev mode
devenv shell pnpm -- -w watch:electron      # Watch mode (Terminal 1)
devenv shell pnpm -- -w start:electron      # Run app (Terminal 2, refresh with F5/Cmd+R)

# Building
devenv shell pnpm -- -w build:electron      # Full build
devenv shell -- bash -c 'NODE_ENV=production pnpm -w build:electron'  # Production build

# Code Quality
devenv shell pnpm -- -w check               # Run all checks (types, lint, format)
devenv shell pnpm -- -w fix                 # Auto-fix lint and format issues

# Testing
devenv shell pnpm -- -w test                # Unit tests
devenv shell pnpm -- -w e2e                 # E2E tests (requires browser target setup)
devenv shell pnpm -- -w e2e --ui            # E2E with Playwright UI
```

## Architecture

### Monorepo Structure (pnpm workspaces)

- **packages/frontend/** - React UI (shared across all targets)
- **packages/runtime/** - Runtime interface abstraction (`Runtime` interface in `runtime.ts`)
- **packages/shared/** - Shared utilities, types, and logger
- **packages/target-electron/** - Electron main process + runtime implementation
- **packages/target-tauri/** - Tauri backend (WIP)
- **packages/target-browser/** - Browser webserver + runtime implementation
- **packages/e2e-tests/** - Playwright E2E tests

### Key Architectural Patterns

**Runtime Abstraction**: The frontend imports `@deltachat-desktop/runtime-interface` which provides a `Runtime` interface. Each target (Electron/Tauri/Browser) implements this interface in their `runtime-*/runtime.ts`. This allows the same frontend code to run on all platforms.

**Backend Communication**: The frontend communicates with Delta Chat Core via JSON-RPC through `BackendRemote` (in `packages/frontend/src/backend-com.ts`). Core is a Rust library accessed via `@deltachat/jsonrpc-client`.

**Screen Controller**: `ScreenController.tsx` manages application screens (Welcome, Main, Login, etc.) and account selection. It's a class component that provides context to the entire app.

**Context Providers**: The app uses multiple React contexts (ChatContext, DialogContext, ScreenContext, etc.) nested in ScreenController for state management.

### Translations

- Located in `_locales/` directory
- Use `window.static_translate` for static strings, `useTranslationFunction()` hook for components
- Experimental strings go in `_locales/_untranslated_en.json`

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` / `add:` - New features (appears in changelog "Added")
- `fix:` - Bug fixes (appears in changelog "Fixed")
- `change:` / `update:` - Changes to existing functionality
- `remove:` - Removal of features
- `docs:`, `test:`, `chore:`, `ci:` - Don't appear in changelog

## CSS Guidelines

- Use CSS modules: `styles.module.scss` next to components
- Class names: camelCase (`.searchInput`)
- Use logical properties for RTL support (`padding-inline-start` not `padding-left`)
- Theme variables: CSS custom properties (`var(--primaryColor)`)
- SCSS local variables use `$borderRadius` syntax

## Development Environment

This project uses [devenv](https://devenv.sh/) to manage the development environment. All commands must be run inside a devenv shell (`devenv shell` or automatic activation via direnv). The devenv configuration provides the correct versions of Node.js, pnpm, and other required dependencies.

## Important Notes

- Node.js 22+ and pnpm 9.6+ required (provided by devenv)
- After `pnpm install` in e2e-tests, run `devenv shell npx -- playwright install --with-deps`
- Use `DC_TEST_DIR` env var (in `.env`) to run multiple instances locally
- The `-w` flag runs scripts from workspace root regardless of current directory
- **Playwright/Chrome**: When running Playwright (including MCP tools), you must unset `LD_LIBRARY_PATH` to avoid GLIBC version conflicts between Nix store libraries and the system. Use `env -u LD_LIBRARY_PATH` as a prefix (see the `e2e` alias in `devenv.nix`).
