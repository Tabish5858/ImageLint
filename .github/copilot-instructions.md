# ImageLint — Copilot Instructions

## Project Overview

ImageLint is a VS Code extension that detects, reports, and fixes unoptimized images in codebases. It behaves like a linter for image assets with background scanning, inline diagnostics, and one-click fixes.

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Runtime:** VS Code Extension Host (Node.js)
- **Image Processing:** sharp (raster), svgo (SVG), gifsicle (GIF via execFile)
- **Bundler:** esbuild → dist/extension.js
- **Testing:** mocha + @vscode/test-electron
- **Lint/Format:** ESLint + Prettier

## Architecture

```
src/extension.ts    → Lifecycle, orchestration, command registration
src/scanner.ts      → Workspace image discovery (findFiles)
src/analyzer.ts     → Issue detection (size, format, dimensions heuristics)
src/optimizer.ts    → Compression, format conversion, resize (sharp/svgo/gifsicle)
src/diagnostics.ts  → Inline diagnostics on code files referencing images
src/codeActions.ts  → Quick-fix action provider
src/report.ts       → WebView audit report panel
src/watcher.ts      → Debounced file system watcher
src/config.ts       → Typed VS Code settings reader
src/statusBar.ts    → Status bar controller
src/utils.ts        → Shared utilities (formatBytes, escapeRegExp, etc.)
src/types.ts        → TypeScript interfaces and types
webview/            → WebView HTML/CSS/JS (CSP-protected, nonce-based)
```

## Key Patterns

- All VS Code disposables are registered via `context.subscriptions.push()`
- WebView uses strict CSP: `default-src 'none'; style-src; script-src 'nonce-...'`
- Dynamic WebView content is escaped with `escapeHtml()`
- External binaries invoked only via `execFile()` (never `exec()`)
- File watcher is debounced (600ms) to prevent scan thrashing
- Config values are clamped/validated (e.g., quality 1-100)

## Security Rules

- Never use `exec()` or `child_process.spawn` with shell: true
- Never disable or weaken WebView CSP
- Always escape dynamic content in WebView with `escapeHtml()`
- Never expose internal error details to users
- File paths come from VS Code APIs — still validate before operations

## Build & Test Commands

```bash
npm run build          # esbuild production bundle
npm run watch          # esbuild watch mode
npm run lint           # ESLint check
npm test               # Build + compile tests + run in VS Code host
npm run compile-tests  # TypeScript compile test files only
```

## Configuration Settings

All settings are under `imagelint.*` namespace:

- `enabled`, `sizeThreshold`, `autoConvertToWebP`, `preferAVIF`
- `scanOnSave`, `excludePatterns`, `showStatusBar`, `compressionQuality`
- `diagnostics.enabled`, `diagnostics.severity`, `diagnostics.fileTypes`

## Commands

Public: `scanWorkspace`, `optimizeFile`, `optimizeAll`, `showReport`, `clearDiagnostics`, `toggleEnabled`
Internal: `applyFix`, `ignoreImage`
