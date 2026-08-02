# PersonalBookmarkManager

Take-home exercise submission for a Full-Stack Developer role at Bangkok Bank
(BBL).

## Current status

Phase 3 completes the secured backend API: collection and bookmark CRUD,
validated pagination, private-by-default Prisma queries, and the approved
read-only collection sharing and leave routes. The React/Vite shell remains
minimal; frontend authentication and functional resource UI are intentionally
deferred.

## Prerequisites

- Node.js 22.22.0
- npm 10.9.4

With `nvm` installed:

```sh
nvm install
nvm use
```

## Setup

Install all backend and frontend workspace dependencies from the repository
root:

```sh
npm ci
```

Prisma client generation runs automatically during installation and backend
builds. To create a local SQLite database from the committed migrations:

```sh
cp backend/.env.example backend/.env
npm run db:migrate
```

Real `.env` files and SQLite databases are ignored by Git.

## Run locally

Use two terminals from the repository root:

```sh
npm run dev:backend
```

```sh
npm run dev:frontend
```

The backend listens on `http://localhost:3001` and accepts browser CORS
requests only from the frontend at `http://localhost:3000`. `GET /me` requires
an Auth0 bearer access token for audience
`https://bbl-candidate-test-api`; it returns only the synchronized Auth0 email.
The documented collection, bookmark, and share routes are now available. No
Auth0 client secret is used or required.

## Verify

Run the complete repository gate:

```sh
npm run check
```

Individual commands are also available:

```sh
npm run db:validate
npm run db:generate
npm run lint
npm run typecheck
npm test
npm run build
```

The HTTP tests run against an ephemeral local Auth0 stub and a temporary SQLite
database initialized from the committed migration, so they need no live
credentials. They seed owner, grantee, and outsider identities to verify the
private-by-default and approved-share behavior.
