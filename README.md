# ImageLint

ESLint for images in VS Code-compatible editors. ImageLint scans your workspace, flags unoptimized images inline, and provides one-click fixes.

## Why ImageLint

- Detects oversized and legacy-format images before they ship.
- Surfaces issues directly in editor diagnostics and quick fixes.
- Runs batch audits with estimated savings.
- Supports VS Code, Cursor, and other VS Code-compatible editors.

## Features

- Background scans (`on startup`, `on save`, `manual command`)
- Inline diagnostics on image references in code
- Quick fixes:
  - Compress in place
  - Convert to modern format (`WebP` / `AVIF`)
  - Resize width
  - Ignore image
- Audit report WebView with "Fix All"
- Status bar summary (issue count + potential savings)

## Supported Formats

**Scanned for optimization:**

- PNG
- JPEG/JPG

**Recognized but not scanned (already modern or non-convertible):**

- WebP — already modern format
- AVIF — already modern format

**Not scanned:**

- GIF — animation would be lost in WebP conversion
- SVG — vector format, different optimization requirements

## Commands

- `ImageLint: Scan Workspace` (`imagelint.scanWorkspace`)
- `ImageLint: Optimize Active Image` (`imagelint.optimizeFile`)
- `ImageLint: Optimize All Flagged Images` (`imagelint.optimizeAll`)
- `ImageLint: Show Audit Report` (`imagelint.showReport`)
- `ImageLint: Clear Diagnostics` (`imagelint.clearDiagnostics`)
- `ImageLint: Toggle Enabled` (`imagelint.toggleEnabled`)

## Settings

All settings are under `imagelint.*`:

- `imagelint.enabled` (default: `true`)
- `imagelint.sizeThreshold` in KB (default: `100`)
- `imagelint.autoConvertToWebP` (default: `true`)
- `imagelint.preferAVIF` (default: `false`)
- `imagelint.scanOnSave` (default: `true`)
- `imagelint.excludePatterns` (default: `["**/node_modules/**"]`)
- `imagelint.showStatusBar` (default: `true`)
- `imagelint.compressionQuality` 1-100 (default: `80`)

## Development

```bash
npm install
npm run build
```

Watch mode:

```bash
npm run watch
```

Run tests:

```bash
npm test
```

## Project Structure

```text
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
```

## Publishing

```bash
npm install -g @vscode/vsce
vsce package
vsce publish
```

## Notes

- `sharp` and `svgo` are bundled dependencies.
- GIF optimization uses `gifsicle` from PATH.
- The current scaffold is a production-oriented MVP and can be extended with more advanced static analysis and project-specific image usage inference.
