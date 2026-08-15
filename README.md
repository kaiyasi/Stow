# STOW

STOW is a private, cross-device clipboard and notes workspace. It provides a
single place to collect text, links, code snippets, and personal notes, then
access them from any signed-in device.

## Overview

STOW is designed around a private-by-default workflow:

- Unauthenticated visitors see the product introduction page.
- Authenticated users can save, search, edit, copy, pin, and delete content.
- Account sessions remain valid for up to one year on the current device.
- Saved content is stored in PostgreSQL and is not treated as browser-local data.
- Sharing is explicit and enforced by the server.

## Features

- Clipboard and note capture with automatic link and code detection
- Full-text filtering, recent/oldest sorting, and list/grid views
- Content preview, editing, copying, tagging, pinning, and deletion
- Username and password authentication
- Gmail-based password recovery using one-time, time-limited tokens
- Account management for recovery Gmail and password updates
- Recipient-restricted and link-based sharing with server-side access control
- Revocable sharing links with unpredictable tokens
- Responsive layout with keyboard shortcuts and mobile navigation

## Security

The application includes the following safeguards:

- Passwords are stored as bcrypt hashes.
- Sessions use server-side records and one-year `HttpOnly` cookies.
- Cookies use `SameSite=Lax`; production HTTPS enables the `Secure` flag.
- State-changing API requests require a CSRF token.
- Authentication endpoints are rate-limited.
- SQL queries use parameterized statements.
- Helmet provides security-related HTTP headers.
- Request bodies and stored content have size and input validation limits.
- Sharing permissions are checked by the server for every protected request.

## Architecture

The project uses a platform-independent Express server with a static HTML/CSS/JavaScript frontend:

```text
STOW/
├── assets/              # Images and favicon assets
├── server/
│   ├── config.js        # Runtime configuration
│   ├── database.js      # PostgreSQL pool and schema
│   ├── errors.js        # Shared API error type
│   ├── mail.js          # Password-reset email delivery
│   └── server.js        # Express API, authentication, and ACL
├── index.html           # Application markup
├── styles.css           # Interface styles
├── app.js               # Frontend state and interactions
├── package.json         # Runtime scripts and dependencies
└── .env.example         # Environment variable template
```

Platform-specific deployment files are intentionally maintained outside the
canonical source repository so the project can be published independently.

## Requirements

- Node.js 20 or later
- npm
- PostgreSQL 15 or later

## Local Development

Create a local environment file, install dependencies, and start the server:

```sh
cp .env.example .env
npm install
npm start
```

The application listens on `APP_PORT` and defaults to port `3000`.

Run the lightweight source checks with:

```sh
npm run check
```

The static `index.html` can be opened for a visual preview, but authentication,
database persistence, synchronization, sharing, and password recovery require
the Express server and PostgreSQL connection.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `APP_PORT` | HTTP port; defaults to `3000` |
| `APP_BASE_URL` | Public origin used in sharing and password-reset links |
| `DATABASE_URL` | PostgreSQL connection string; alternatively use `POSTGRES_*` variables |
| `POSTGRES_HOST` | PostgreSQL hostname |
| `POSTGRES_PORT` | PostgreSQL port |
| `POSTGRES_DB` | PostgreSQL database name |
| `POSTGRES_USER` | PostgreSQL user |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_SECURE` | Use implicit TLS when set to `true` |
| `SMTP_USER` | SMTP account username |
| `SMTP_PASSWORD` | SMTP account password |
| `SMTP_FROM` | Sender name and address |

Never commit a production `.env` file to the canonical source repository.

## Keyboard Shortcuts

- `/` — Focus search
- `N` — Focus the new-entry editor
- `SUPER/Ctrl + Enter` — Save the current entry
- `Esc` — Close the active dialog

## License

No open-source license has been declared yet.
