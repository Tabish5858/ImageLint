# Security Policy

## Supported Versions

Security fixes are prioritized for the current development branch and the latest
published release line.

| Version                     | Supported |
| --------------------------- | --------- |
| main branch                 | Yes       |
| Latest release line (0.5.x) | Yes       |
| Older release lines         | No        |

## Reporting a Vulnerability

Please report vulnerabilities privately.

1. Open a private security advisory draft:
   https://github.com/Tabish5858/ImageLint/security/advisories/new
2. Include clear reproduction steps and impact.
3. Share affected versions and any proposed remediation if available.
4. Include whether exploitation requires workspace trust, local file access, or
   user interaction.

Please do not open public issues for security vulnerabilities.

## Scope

The policy applies to:

- Extension runtime code under `src/`
- WebView assets under `webview/`
- Automation scripts under `scripts/`
- GitHub workflows and release/publishing automation

The policy generally excludes vulnerabilities only present in unsupported
third-party forks or user-modified builds.

## Disclosure Process

- Acknowledgement target: within 3 business days
- Initial triage target: within 7 business days
- Fix and coordinated disclosure timeline: based on severity and complexity
- Public disclosure: after fix release or coordinated mitigation guidance

We aim to credit responsible reporters unless anonymity is requested.
