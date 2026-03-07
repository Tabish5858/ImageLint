# ImageLint: Full Architecture and Developer Handoff

Prepared by Tabish Bin Ishfaq - March 2026

## 1. Project Overview

ImageLint is a VS Code/Cursor extension that detects, reports, and fixes unoptimized images in codebases. It behaves like a linter for image assets: background scanning, inline diagnostics, and one-click fixes.

### 1.1 Problem

- Developers manually compress images outside the editor.
- Oversized images silently reduce performance and Lighthouse scores.
- Existing extensions focus on manual compression, not intelligent linting.

### 1.2 Solution

- Background watcher scans image assets in workspace.
- Analyzer flags issues by size, format, and dimensions.
- Diagnostics are shown inline where images are referenced.
- Quick fixes and report-level "Fix All" optimize assets in-place.

## 2. Stack

- Language: TypeScript (strict)
- Runtime: Node.js (VS Code extension host)
- VS Code API: `vscode`
- Raster processing: `sharp`
- SVG optimization: `svgo`
- GIF optimization: `gifsicle` (exec)
- Bundling: `esbuild`
- Testing: `mocha` + `@vscode/test-electron`
- Lint/format: ESLint + Prettier
- CI: GitHub Actions
- Publishing: `vsce`

## 3. Repository Layout

```text
imagelint/
  src/
    extension.ts
    scanner.ts
    analyzer.ts
    optimizer.ts
    diagnostics.ts
    codeActions.ts
    report.ts
    watcher.ts
    config.ts
    statusBar.ts
    utils.ts
    types.ts
  webview/
    report.html
    report.css
    report.js
  test/
    suite/
      utils.test.ts
    fixtures/
  .github/workflows/
    ci.yml
  package.json
  tsconfig.json
  esbuild.js
  .vscodeignore
  README.md
  CHANGELOG.md
```

## 4. System Flow

### 4.1 Activation

1. Extension activates on startup/command.
2. `activate()` registers commands, code actions, diagnostics, watcher, status bar.
3. Initial scan runs and populates diagnostics/status.

### 4.2 Scan Pipeline

1. `scanner.ts` collects image files via `workspace.findFiles`.
2. `analyzer.ts` computes metadata/size heuristics and produces `ImageIssue[]`.
3. `diagnostics.ts` locates references in source files and creates inline warnings/errors.
4. `statusBar.ts` displays issue count + projected savings.

### 4.3 Fix Flow

1. User triggers quick fix or command.
2. `optimizer.ts` executes one of:
   - `compress`
   - `convert-modern`
   - `resize`
3. For conversions, code references are updated.
4. Scan reruns and diagnostics refresh.

### 4.4 Audit Report

1. `report.ts` opens WebView panel.
2. Issues are posted as structured JSON.
3. `webview/report.js` renders table + summary.
4. "Fix All" posts message back to extension host.

## 5. Key Module Responsibilities

- `extension.ts`: lifecycle + orchestration
- `scanner.ts`: workspace image discovery
- `analyzer.ts`: issue detection heuristics
- `optimizer.ts`: image operations (`sharp`, `svgo`, `gifsicle`)
- `diagnostics.ts`: reference matching and inline diagnostics
- `codeActions.ts`: quick-fix action provider
- `report.ts`: WebView panel and messaging
- `watcher.ts`: debounced scan triggers
- `config.ts`: typed settings reader
- `statusBar.ts`: bottom bar scan summary

## 6. Config Surface

- `imagelint.enabled`
- `imagelint.sizeThreshold`
- `imagelint.autoConvertToWebP`
- `imagelint.preferAVIF`
- `imagelint.scanOnSave`
- `imagelint.excludePatterns`
- `imagelint.showStatusBar`
- `imagelint.compressionQuality`

## 7. Commands

- `imagelint.scanWorkspace`
- `imagelint.optimizeFile`
- `imagelint.optimizeAll`
- `imagelint.showReport`
- `imagelint.clearDiagnostics`
- `imagelint.toggleEnabled`

Internal commands:

- `imagelint.applyFix`
- `imagelint.ignoreImage`

## 8. Milestone Mapping

- Week 1: scaffold + activation
- Week 2: scanner + analyzer
- Week 3: optimizer baseline
- Week 4: diagnostics integration
- Week 5: quick fixes
- Week 6: report WebView
- Week 7: SVG/GIF and watcher polish
- Week 8: tests, docs, publish

## 9. Publishing Notes

- Publish once to VS Code Marketplace.
- Cursor/Windsurf consume extension directly.
- Open VSX can be added for broader ecosystem.
- Ensure `README`, `CHANGELOG`, icon, and categories are complete before first release.

## 10. Current MVP Constraints

- Reference detection uses textual matching and may produce false positives in very large monorepos.
- GIF optimization requires `gifsicle` installed in runtime environment.
- Dimension heuristic is generic and not framework-aware (future enhancement: infer rendered dimensions from component usage).
