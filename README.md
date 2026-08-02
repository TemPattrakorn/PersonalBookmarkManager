# PersonalBookmarkManager

Take-home exercise submission for a Full-Stack Developer role at Bangkok Bank
(BBL).

## Current status

Phase 2 adds global Auth0 access-token verification, per-request `/userinfo`
identity synchronization, local person persistence, sanitized authentication
errors, and `GET /me` to the Phase 1 NestJS/Prisma/SQLite foundation. The
React/Vite shell remains minimal. Bookmark, collection, and sharing routes,
frontend authentication, seed data, and functional resource UI are
intentionally not implemented yet.

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
All other routes are currently unimplemented and return the normalized generic
`404` response. No Auth0 client secret is used or required.

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

Phase 2 authentication tests run against an ephemeral local Auth0 stub and do
not need live credentials. There is no seed data yet; owner, grantee, and
outsider fixtures will be added with authenticated resource behavior.
