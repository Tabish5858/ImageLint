# ImageLint

![ImageLint logo](docs/screenshots/icon.avif)

[![CI](https://github.com/Tabish5858/ImageLint/actions/workflows/ci.yml/badge.svg)](https://github.com/Tabish5858/ImageLint/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Tabish5858/ImageLint/actions/workflows/codeql.yml/badge.svg)](https://github.com/Tabish5858/ImageLint/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/Tabish5858/ImageLint)](https://github.com/Tabish5858/ImageLint/commits/main)
[![Issues](https://img.shields.io/github/issues/Tabish5858/ImageLint)](https://github.com/Tabish5858/ImageLint/issues)
[![Stars](https://img.shields.io/github/stars/Tabish5858/ImageLint?style=social)](https://github.com/Tabish5858/ImageLint/stargazers)

ImageLint is a VS Code extension that acts like a linter for image assets. It scans your workspace, flags unoptimized images inline, and provides one-click fixes.

## Features

- Fast workspace scan for oversized and legacy-format images
- Inline diagnostics in code files that reference flagged images
- Quick fixes to compress, convert format, resize, or ignore images
- Audit report panel with estimated savings and batch Fix All
- Background watch mode with debounced re-scan behavior
- Configurable thresholds and diagnostics severity

## Supported Formats

| Format   | Behavior                                        |
| -------- | ----------------------------------------------- |
| PNG      | Scanned and optimizable                         |
| JPEG/JPG | Scanned and optimizable                         |
| WebP     | Recognized as modern (no conversion suggestion) |
| AVIF     | Recognized as modern (no conversion suggestion) |
| GIF      | Skipped for conversion to preserve animation    |
| SVG      | Skipped by raster optimization pipeline         |

## Commands

- ImageLint: Scan Workspace (`imagelint.scanWorkspace`)
- ImageLint: Optimize Active Image (`imagelint.optimizeFile`)
- ImageLint: Optimize All Flagged Images (`imagelint.optimizeAll`)
- ImageLint: Show Audit Report (`imagelint.showReport`)
- ImageLint: Clear Diagnostics (`imagelint.clearDiagnostics`)
- ImageLint: Toggle Enabled (`imagelint.toggleEnabled`)

## Settings

All settings are namespaced under `imagelint.*`:

- `imagelint.enabled`
- `imagelint.sizeThreshold`
- `imagelint.autoConvertToWebP`
- `imagelint.preferAVIF`
- `imagelint.scanOnSave`
- `imagelint.excludePatterns`
- `imagelint.showStatusBar`
- `imagelint.compressionQuality`
- `imagelint.diagnostics.enabled`
- `imagelint.diagnostics.severity`
- `imagelint.diagnostics.fileTypes`

## Local Setup and Run

Prerequisites:

- Node.js 20+
- npm 10+
- VS Code 1.75+

Install and build:

```bash
npm ci
npm run build
```

Run extension in development:

1. Open this repository in VS Code.
2. Press `F5` to launch the Extension Development Host.
3. Open the command palette and run `ImageLint: Scan Workspace`.

Useful development commands:

```bash
npm run watch
npm run lint
npm run compile-tests
npm run smoke-test
npm test
```

## CI and Automation

- Node CI workflow runs lint, build, compile-tests, and smoke-test on pushes and pull requests to main.
- CodeQL workflow scans JavaScript/TypeScript for security and quality issues.
- Dependency review workflow blocks pull requests that introduce high-severity vulnerable dependencies.
- Dependabot groups GitHub Actions and npm dependency updates to reduce PR noise.

## Troubleshooting

### Sharp install issues on local machine

Run a clean install:

```bash
rm -rf node_modules package-lock.json
npm install
```

If required, install all prebuilt sharp targets:

```bash
npm run install:sharp-all
```

### gifsicle not found

ImageLint uses `gifsicle` from PATH for GIF optimization scenarios. Install it with your OS package manager and retry.

### Diagnostics are not appearing

- Ensure `imagelint.enabled` is true.
- Ensure `imagelint.diagnostics.enabled` is true.
- Confirm the active file extension exists in `imagelint.diagnostics.fileTypes`.

## Documentation and Governance

- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md)
- Code of Conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Security Policy: [SECURITY.md](SECURITY.md)
- Support Guide: [SUPPORT.md](SUPPORT.md)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
