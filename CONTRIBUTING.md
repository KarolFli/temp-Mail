# Contributing

Thanks for your interest in improving TempMail! 🎉

## Branching model

| Branch        | Purpose                                                    |
| ------------- | ---------------------------------------------------------- |
| `main`        | Stable, production-ready code. Every release is tagged.    |
| `develop`     | Integration branch — all pull requests target this branch. |
| `feature/*`   | New features, e.g. `feature/custom-ttl`.                   |
| `fix/*`       | Bug fixes, e.g. `fix/sse-reconnect`.                       |

1. Fork the repo and create your branch from `develop`.
2. Make your change, with tests where it makes sense.
3. Run the checks:
   ```bash
   npm run typecheck && npm test && npm run build
   ```
4. Open a pull request against `develop`.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):
`feat: …`, `fix: …`, `docs: …`, `refactor: …`, `test: …`, `chore: …`.

## Local development

```bash
cp .env.example .env     # set DOMAINS=localhost for local testing
npm install
npm run dev              # web on :3000, SMTP on :2525
```

Send yourself a test email with any SMTP client, for example
[swaks](https://github.com/jetmore/swaks):

```bash
swaks --server localhost:2525 --to test@localhost --header "Subject: Hello" --body "It works!"
```

## Translations

All user-facing text lives in [`src/lib/i18n.ts`](src/lib/i18n.ts). Please add
new strings in every language — TypeScript will complain if one is missing.
