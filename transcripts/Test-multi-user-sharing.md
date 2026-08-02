# Test multi-user sharing

> I only have one Auth0 tenant. How do I test multi user function like sharing?

<details><summary>2 previous messages</summary>

> I’ll check the project’s Auth0 setup and sharing contract so the test steps match this app’s authorization model.
>
> <details><summary>Searched the web</summary>
>
> Searched the web for `site:auth0.com/docs user management create users email verification Auth0 dashboard`
>
> Searched the web for `site:auth0.com/docs user management create users email verification Auth0 dashboard`
>
> </details>
</details>

One Auth0 tenant is enough—create three normal app users inside it: owner, recipient, outsider. Don’t add them as Auth0 Dashboard members.

1. In Auth0: **User Management → Users → Create User**. Choose the database connection enabled for your SPA, then create `owner@…`, `recipient@…`, and `outsider@…`. [Auth0’s user-creation guide](https://auth0.com/docs/manage-users/user-accounts/create-users)
2. Verify the recipient’s email. This app intentionally allows private use before verification, but only verified users can receive a share.
3. Log in as the recipient once and open the app; this creates their local person record. Log out.
4. Log in as the owner, create a collection, and share it with the recipient’s exact email.
5. Log in as the recipient—ideally in an incognito window or separate browser profile—and confirm it appears under **Shared by others**, read-only.
6. Log in as the outsider and confirm it sees neither the collection nor its bookmarks.

For automated coverage, run `npm test`; the project’s HTTP tests already use distinct owner, grantee, and outsider identities without requiring live Auth0 accounts.

> I do not have access to Auth0: User Management. This are the only Auth0 tenant information I get:
>
> Discovery Endpoint: https://dev-yg.us.auth0.com/.well-known/openid-configuration
> Client ID: H9F6QG5SzTKMv0tbmgxLj9LjG1EKVllA
> Callback URL: http://localhost:3000/callback
> Logout URL: http://localhost:3000
> Scope: openid profile email
> API Audience (available): https://bbl-candidate-test-api
>
> Also Test user: candidate@test.com and Password

<details><summary>1 previous message</summary>

> I’ll verify whether the app permits self-sharing and what its offline test harness covers, so I can distinguish what’s testable with the supplied credentials from what isn’t.
</details>

You’re right—without Auth0 user-management access, you cannot manually test a real cross-user share with only `candidate@test.com`.

Two browser windows still represent the same Auth0 `sub`; this app rejects sharing a collection with yourself (`400`). A second Auth0 tenant would also not work with this app’s configured issuer/client.

Your viable options are:

- Run `npm test`. Its local Auth0 stub creates owner, grantee, and outsider identities, and exercises sharing, read-only access, revocation, leaving, and isolation.
- Ask the tenant administrator for two additional credentials on this same tenant: a verified recipient and an outsider. Each must log into the app once before the owner can share to them.
- With only `candidate@test.com`, manually test private CRUD and that self-sharing is rejected, but not successful sharing.

Keep the supplied password out of source control and `.env` files.

> Explain how [sharing-ui.spec.tsx](frontend/src/features/sharing-ui.spec.tsx) test multi user sharing

<details><summary>1 previous message</summary>

> I’ll trace the spec’s mocked identities and requests, then explain what it proves versus the backend’s real multi-user tests.
</details>

[sharing-ui.spec.tsx](./frontend/src/features/sharing-ui.spec.tsx) does **not** log in multiple Auth0 users. It simulates the API result for two roles using the response field `access`.

- `ownerCollection` has `access: "owner"`.
- `viewerCollection` and `viewerBookmark` have `access: "viewer"`.
- The mocked `useBookmarks()` hook returns a shared collection and bookmark as `viewer`.

The three tests then render components to HTML and check UI behavior:

1. An owner sees **Manage sharing** and **Delete**, but not **Leave shared collection**.
2. A viewer sees **Leave shared collection**, but cannot manage sharing or rename the collection.
3. When viewing shared bookmarks, the UI displays the read-only message and hides **Add bookmark**, **Edit**, and **Delete**.

`MemoryRouter` only supplies a route; it does not authenticate anyone. Likewise, the mock replaces the normal bookmark-data hook, so no API calls occur.

In short: it tests that the frontend correctly reacts to the backend’s `access: "owner" | "viewer"` contract. The real multi-user authorization—distinct identities, granting, revoking, leaving, and preventing outsider access—is covered by the backend E2E specs, especially [shares.e2e.spec.ts](./backend/test/e2e/shares.e2e.spec.ts).

> Explain how [shares.e2e.spec.ts](backend/test/e2e/shares.e2e.spec.ts) test multi users sharing

<details><summary>1 previous message</summary>

> I’ll trace the share E2E spec together with its local Auth0 harness so the identity simulation and assertions are clear.
</details>

[shares.e2e.spec.ts](./backend/test/e2e/shares.e2e.spec.ts) tests multiple users without live Auth0 or real credentials. It creates separate simulated Auth0 identities and sends each request with that identity’s own signed bearer token.

Setup for every test:

1. A test RSA key pair is generated.
2. [startResourceHarness](./backend/src/resource.test-harness.ts) starts:
   - a fresh temporary SQLite database using the real migration;
   - the real NestJS app;
   - a local fake Auth0 server for discovery, JWKS, and `/userinfo`.
3. The spec creates three actors with different stable Auth0 subjects:

   | Actor | Auth0 subject | Email |
   |---|---|---|
   | Owner | `auth0|owner` | `owner@example.com` |
   | Grantee | `auth0|grantee` | `Grantee@Example.com` |
   | Outsider | `auth0|outsider` | `outsider@example.com` |

4. Each actor calls `/me`. That simulates each person having logged in once, so the backend upserts separate local `Person` records.

When `requestAs(harness, actor, path)` runs, it:

- places that actor’s signed JWT in `Authorization: Bearer …`;
- makes fake Auth0 `/userinfo` return the matching `sub`, email, and verification state;
- sends the HTTP request to the real NestJS route.

So this is a real HTTP/auth/database test, with fake identity infrastructure.

What the first test verifies:

- The owner creates a collection and grants the verified grantee access.
- Repeating the grant is idempotent (`201`, then `200` with the same share).
- Only the owner can list or revoke shares.
- Self-sharing is rejected.
- Unknown, unverified, and ambiguous-email recipients fail without disclosing why.
- After the owner revokes, the grantee can no longer read the collection.

What the second test verifies:

- The owner shares one collection with two different grantees.
- When grantee A leaves, only A loses access.
- Grantee B still has access.
- The owner’s bookmark remains intact.
- Leaving a nonexistent/already-left share returns `204` for owner, grantee, and outsider alike—preventing existence leaks.
- Regranting still works after leaving.
- If the grantee’s email changes, access remains because the share is bound to their stable local person ID/Auth0 subject, not the email string.
- Deleting the collection revokes shares while preserving the owner’s bookmark as uncategorized.

It is sequential rather than two browsers acting simultaneously, but each request is authenticated as a distinct user—the important property for authorization testing.

> why describe, beforeAll, beforeEach, afterEach, it, expect syntax in my vscode have error?
>
> error example:
> Cannot find name 'describe'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha` and then add 'jest' or 'mocha' to the types field in your tsconfig.

<details><summary>1 previous message</summary>

> I’ll check the workspace test configuration and TypeScript project boundaries to identify why VS Code is not loading the test globals.
</details>

Those names are test-runner globals, not TypeScript built-ins.

For [shares.e2e.spec.ts](./backend/test/e2e/shares.e2e.spec.ts), the underlying issue is configuration—not a missing package:

- `@types/jest` is already installed in [backend/package.json](./backend/package.json).
- But [backend/tsconfig.json](./backend/tsconfig.json) includes only `src/**/*.ts`.
- The E2E spec is under `test/e2e`, so VS Code treats it as an inferred TypeScript project and does not load Jest’s globals.
- Jest still runs it because its configuration explicitly includes `test/e2e/http.e2e.spec.ts`, which imports this spec.

The smallest file-level fix is to explicitly import the test functions:

```ts
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
```

That removes reliance on ambient globals and should clear the VS Code errors in this spec without adding dependencies.

For [sharing-ui.spec.tsx](./frontend/src/features/sharing-ui.spec.tsx), the test already correctly imports `describe`, `expect`, `it`, and `vi` from `vitest`; if that file shows the same error, run `npm ci`, then in VS Code run **TypeScript: Restart TS Server** and ensure it uses the workspace TypeScript version.

> [sharing-ui.spec.tsx](frontend/src/features/sharing-ui.spec.tsx) not shown any error

Correct—[sharing-ui.spec.tsx](./frontend/src/features/sharing-ui.spec.tsx) is fine because it explicitly imports its test API from Vitest:

```ts
import { describe, expect, it, vi } from "vitest";
```

The errors apply only to [shares.e2e.spec.ts](./backend/test/e2e/shares.e2e.spec.ts), which uses Jest globals without importing them, while its TypeScript config excludes the `test/` directory.

> so how to fix these error in backend test again? If do not explicitly import the test function

Don’t import the functions. Add a test-only TypeScript project at:

`/Users/Temmiee/Desktop/PersonalBookmarkManager/backend/test/tsconfig.json`

It should extend the backend config, include `test/**/*.ts`, use `rootDir: ".."`, disable emit, and load `node` and `jest` types. VS Code will associate every file below `backend/test/` with this nearest `tsconfig.json`, while the production backend build remains unchanged.

No package installation is needed; `@types/jest` already exists.

Plan: add that one config file, verify VS Code’s Jest globals resolve with `tsc -p backend/test/tsconfig.json --noEmit`, then run the backend test suite. No security or documentation impact. Approve this scope and I’ll make it.

> [tsconfig.json](backend/tsconfig.json) edit it

<details><summary>1 previous message</summary>

> Editing the main config can work, but including `test/` there requires preserving the production build’s current `src` output root. I’ll check the Nest build configuration before proposing the smallest safe change.
</details>

Editing only [backend/tsconfig.json](./backend/tsconfig.json) is possible, but it must become the shared type-check config:

- include `src/**/*.ts` and `test/**/*.ts`;
- add `"types": ["node", "jest"]`;
- change `rootDir` to `"."` so TypeScript accepts both directories.

That would change Nest’s emitted layout from `dist/main.js` to `dist/src/main.js`. To preserve the current production build, I would also add `backend/tsconfig.build.json` containing the existing `src`-only build settings, and make `nest build` use it explicitly.

I also found dependencies are not currently installed (`@nestjs/cli` cannot be resolved), so `npm ci` is needed before VS Code can load the existing Jest type package.

Plan: update the main config plus a build-only config, install dependencies if needed, then run typecheck, backend tests, and build. No security or documentation impact. Approve this adjusted scope and I’ll apply it.

> approve

<details><summary>6 previous messages</summary>

> Approved. I’ll make the TypeScript configuration change, preserve Nest’s existing build layout with a build-only config, then validate the test project and backend gates.
>
> <details><summary>Created a file, edited 2 files</summary>
>
> - Wrote `./backend/package.json` (+1 -1)
> - Wrote `./backend/tsconfig.build.json` (+13 -0)
> - Wrote `./backend/tsconfig.json` (+8 -3)
>
> </details>
>
> The backend TypeScript check now includes the E2E sources and passes. I’ll run the backend test suite and build next to verify the separate build configuration preserved runtime output.
>
> The build configuration exposed existing Jest-based helpers and specs under `backend/src`. I’m keeping Jest types in the build type environment as well; that preserves the prior compilation behavior while still excluding `backend/test` from emitted output.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./backend/tsconfig.build.json` (+2 -1)
>
> </details>
>
> The configuration now covers Jest globals in both `src` and E2E tests, while `nest build` uses the source-only build config. Typecheck, backend tests, build, and lint all pass.
</details>

Fixed the VS Code Jest-global errors without importing test functions.

- Updated [backend/tsconfig.json](./backend/tsconfig.json) to include `test/**/*.ts` and load `node`/`jest` types.
- Added [backend/tsconfig.build.json](./backend/tsconfig.build.json) so production builds still compile only `src`.
- Updated [backend/package.json](./backend/package.json) to use that build config.

Verified: backend typecheck, tests, build, and lint pass. Restart the VS Code TypeScript server if diagnostics remain visible.

> after i ran npm test how do i view test results?

<details><summary>3 previous messages</summary>

> I’ll run the backend suite in verbose mode once to confirm the exact command and output you should expect.
>
> The suite is discovering three test entry files, but its normal reporter is not printing a summary in this environment. I’ll check Jest’s machine-readable report to verify the result and give you a reliable viewing command.
>
> A focused unit-spec command prints normally. The E2E aggregate currently does not emit its summary before exiting in this environment, so I’m checking Jest’s forced final report to distinguish output suppression from an E2E runner issue.
</details>

Test results appear in the terminal; there is no separate results page by default.

For readable backend output, run:

```sh
npm test --workspace backend -- --verbose
```

For one quick spec:

```sh
npm test --workspace backend -- --runTestsByPath src/api-exception.filter.spec.ts --verbose
```

You should see output such as:

```text
PASS backend/src/api-exception.filter.spec.ts
Tests: 1 passed, 1 total
```

To run the multi-user sharing E2E entry specifically:

```sh
npm test --workspace backend -- --runTestsByPath test/e2e/http.e2e.spec.ts --verbose
```

Important: I found that this E2E command currently prints only Node’s experimental warning and no Jest pass/fail summary, even with `--verbose`. So it is not currently giving a reliable visible E2E result; that needs separate diagnosis. The small unit spec does report normally.

> save this in [README.md](README.md)

<details><summary>2 previous messages</summary>

> I’ll add a short “Viewing test results” subsection to the README’s verification section, including the backend commands and the current E2E reporting caveat.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./README.md` (+25 -0)
>
> </details>
</details>

Added a **Viewing backend test results** section to [README.md](./README.md).

It includes verbose, focused-unit, and multi-user E2E commands plus the current E2E-summary caveat. `git diff --check` passes.
