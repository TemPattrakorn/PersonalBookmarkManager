# PersonalBookmarkManager

Take-home exercise submission for a Full-Stack Developer role at Bangkok Bank
(BBL).

## Current status

The approved implementation is complete through the core backend, Auth0 SPA,
private CRUD, and read-only collection-sharing UI. Owners can grant, list, and
revoke exact-email shares; grantees see a separate read-only collection list
and may leave a share. The backend remains authoritative for every ownership
and sharing rule.

## Local setup and run

### Prerequisites

- Node.js 22.22.0
- npm 10.9.4

With `nvm` installed:

```sh
nvm install
nvm use
```

### Setup

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

### Run locally

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
The frontend uses the committed public SPA configuration to obtain that token
with Authorization Code flow and PKCE. The documented collection, bookmark,
and share routes are available. No Auth0 client secret or test password is
committed or required in frontend configuration.

The backend shares concurrent identity synchronization and reuses only a
successful result for the exact access token until its verified expiry. It
never caches authentication failures or serves an expired token, so parallel
page loads do not repeat `/userinfo` and person upserts while authorization and
tenant isolation remain server-side.

If an initial collection, bookmark, or share-list request fails, the UI shows
an explicit Retry action instead of an empty-list message. A failed refresh
keeps data already loaded from the same source visible; changing a collection
filter clears the previous filter's data while the new request is pending or
failed. Bookmark Retry also reloads its collection metadata.

## Verification

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

### Backend test results

Jest prints test results directly in the terminal. Use verbose output for the
backend suite:

```sh
npm test --workspace backend -- --verbose
```

To run one focused test file:

```sh
npm test --workspace backend -- --runTestsByPath src/common/filters/api-exception.filter.spec.ts --verbose
```

To run the multi-user HTTP suite:

```sh
npm test --workspace backend -- --runTestsByPath test/e2e/http.e2e.spec.ts --verbose
```

### Automated evidence

The HTTP tests run against an ephemeral local Auth0 stub and a temporary SQLite
database initialized from the committed migration, so they need no live
credentials. They seed owner, grantee, and outsider identities to verify the
private-by-default and approved-share behavior.

The Repository gate on 2026-08-02 passed all 29 backend and 13
frontend tests, in addition to Prisma validation/generation, lint, typechecks,
and production builds. Vite reports a non-failing advisory that the production
JavaScript bundle exceeds 500 kB.
