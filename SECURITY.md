# Security Policy

## Supported versions

Only the latest release on the `main` branch receives security fixes.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report vulnerabilities privately via
[GitHub Security Advisories](https://github.com/KarolFli/temp-Mail/security/advisories/new).
You can expect an initial response within a few days.

## Security model

- Inboxes are **not password-protected** — anyone who knows an address can read it.
  Random addresses are hard to guess, but TempMail must never be used for sensitive accounts.
- Email HTML is rendered in a sandboxed `<iframe>` (no scripts, no same-origin access)
  with its own Content-Security-Policy. Remote images are blocked until the user allows them.
- Attachments are always served as `application/octet-stream` downloads.
- Messages are kept in memory only and are deleted after `MESSAGE_TTL_MINUTES`.
- The SMTP server is receive-only, rejects unknown domains and has no relay or AUTH.
