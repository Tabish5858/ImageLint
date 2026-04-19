# Contributing to ImageLint

Thank you for your interest in improving ImageLint.

## Before You Start

- Read the project overview in README.md.
- Search existing issues and pull requests to avoid duplicate work.
- For security issues, do not open a public issue. See SECURITY.md.

## Development Setup

Prerequisites:

- Node.js 20+
- npm 10+
- VS Code 1.75+

Install dependencies:

```bash
npm ci
```

Build once:

```bash
npm run build
```

Run in watch mode while developing:

```bash
npm run watch
```

Run quality checks locally before opening a PR:

```bash
npm run lint
npm run build
npm run compile-tests
npm run smoke-test
```

Optional full test run:

```bash
npm test
```

Recommended full preflight command:

```bash
npm run preflight
```

## Branch and Commit Guidelines

- Branch from `main`.
- Use focused branches, for example: `feat/report-improvements` or `fix/svg-scan-bug`.
- Keep commits small and self-contained.
- Use clear commit messages, preferably Conventional Commit style:
  - `feat: add grouped diagnostics summary`
  - `fix: clamp compression quality`
  - `docs: clarify setup instructions`

## Pull Request Guidelines

- Complete the PR template checklist.
- Include tests for behavior changes whenever possible.
- Update docs for user-facing or workflow changes.
- Keep PRs focused; avoid unrelated refactors.
- For dependency updates, prefer grouped updates through Dependabot configuration.

## Coding Standards

- TypeScript strict mode is required.
- Follow existing architecture boundaries in `src/`.
- Register all VS Code disposables through extension context subscriptions.
- Preserve WebView CSP and escape dynamic content.
- Never use `exec()` or shell-based child process execution for untrusted input.

## Security and Supply Chain

- Do not commit secrets, credentials, or generated release artifacts.
- Keep GitHub Actions changes minimal and review permission scopes.
- When adding dependencies, prefer actively maintained packages and document why
  they are needed.

## Reporting Bugs

Use the Bug Report issue template and include:

- Reproduction steps
- Expected behavior
- Actual behavior
- Environment details (OS, editor version, extension version)

## Suggesting Features

Use the Feature Request issue template and describe:

- Problem statement
- Proposed solution
- Alternatives considered
- Potential UX or configuration impact

## Questions and Support

See SUPPORT.md for support channels and expectations.
