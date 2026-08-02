# PersonalBookmarkManager

Take-home exercise submission for a Full-Stack Developer role at Bangkok Bank
(BBL).

## Current status

Phase 1 provides a runnable NestJS/Prisma/SQLite backend foundation and a
minimal React/Vite shell using React Router and MUI. Authentication, API
routes, bookmark and collection behavior, sharing behavior, and functional UI
are intentionally not implemented yet.

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
requests only from the frontend at `http://localhost:3000`. Because Phase 1
adds no API controller, backend requests currently return Nest's default 404.

## Verify

Run the complete Phase 1 gate:

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

There is no seed data in Phase 1. The owner, grantee, and outsider fixtures
will be added when authenticated resource behavior is implemented and can be
tested meaningfully.
