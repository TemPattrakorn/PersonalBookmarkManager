# Refactor NestJS source structure

> Act as an expert Backend Developer and Software Architect, specializing in Node.js and NestJS.
>
> [src](backend/src/) directory has become cluttered with too many files in a flat structure. It currently contains a mix of controllers, services, modules, guards, filters, and test files for various domains (such as auth, bookmarks, collections, and shares) alongside core configuration and utility files.
>
> Please review the current flat structure of [src](backend/src/) and suggest a comprehensive repository refactor based on NestJS best practices, Domain-Driven Design (DDD), and modular architecture.
>
> Your suggestion should include:
> 1. **Target Directory Structure:** Provide a clear "After" directory tree showing how the files should be grouped. Group the application by feature modules (e.g., `src/modules/auth`, `src/modules/bookmarks`) and separate cross-cutting concerns (e.g., `src/common/filters`, `src/common/guards`, `src/core`).
> 2. **File Mapping:** A brief mapping of where the current files (like `api-exception.filter.ts`, `auth.guard.ts`, `bookmarks.controller.ts`, etc.) should be moved.
> 3. **Refactoring Steps:** A step-by-step guide on how to safely implement this migration, including how to handle updating relative imports, module declarations, and testing setups.
> 4. **Best Practices Rationale:** A short explanation of why this new structure improves maintainability, scalability, and code readability.

<details><summary>3 previous messages</summary>

> I’ll inspect the actual backend tree, module wiring, tests, project guidance, and current diff first. Then I’ll propose a migration that preserves the repository’s privacy boundaries and avoids introducing ceremonial DDD layers the code does not need.
>
> The flat directory contains 24 handwritten source/test-support files plus generated Prisma output. I’m tracing the current dependency boundaries now—especially the shared authorization path—so the proposed folders do not split security logic across features or imply layers that are not present.
>
> The key architectural constraint is a real module cycle hidden by the flat folder: collection routes currently invoke bookmark and share services, while those services depend on `CollectionsService`. A safe modular target should move nested-route controllers to the feature that implements them; simply wrapping today’s files in four Nest modules would create circular imports.
</details>

The backend should become a feature-oriented modular monolith. Use pragmatic DDD boundaries, but skip repository interfaces, factories, and separate `domain/application/infrastructure` layers—the current CRUD scope does not justify them.

The important architectural correction is to split nested bookmark/share routes out of `CollectionsController`. Otherwise, separate Nest modules would create a circular dependency:

```text
CollectionsModule → BookmarksModule / SharesModule
BookmarksModule / SharesModule → CollectionsModule
```

## Target directory structure

```text
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── common/
│   │   ├── filters/
│   │   │   ├── api-exception.filter.ts
│   │   │   └── api-exception.filter.spec.ts
│   │   ├── http/
│   │   │   └── request-validation.ts
│   │   └── security/
│   │       └── resource-access.ts
│   │
│   ├── core/
│   │   ├── config/
│   │   │   └── load-environment.ts
│   │   └── database/
│   │       ├── prisma.module.ts
│   │       └── prisma.service.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.contract.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth0.client.ts
│   │   │   ├── auth0.transport.ts
│   │   │   ├── jose.loader.ts
│   │   │   └── me.controller.ts
│   │   │
│   │   ├── bookmarks/
│   │   │   ├── bookmarks.module.ts
│   │   │   ├── bookmarks.controller.ts
│   │   │   ├── collection-bookmarks.controller.ts
│   │   │   └── bookmarks.service.ts
│   │   │
│   │   ├── collections/
│   │   │   ├── collections.module.ts
│   │   │   ├── collections.controller.ts
│   │   │   └── collections.service.ts
│   │   │
│   │   └── shares/
│   │       ├── shares.module.ts
│   │       ├── shares.controller.ts
│   │       └── shares.service.ts
│   │
│   └── generated/
│       └── prisma/
│           └── ...
│
├── test/
│   ├── support/
│   │   ├── auth.test-assertions.ts
│   │   ├── auth.test-harness.ts
│   │   ├── auth.test-tokens.ts
│   │   └── resource.test-harness.ts
│   └── e2e/
│       ├── http.e2e.spec.ts
│       ├── auth.errors.e2e.spec.ts
│       ├── auth.identity.e2e.spec.ts
│       ├── resources.e2e.spec.ts
│       └── shares.e2e.spec.ts
│
├── prisma/
├── scripts/
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

`auth.guard.ts` belongs in `modules/auth`, despite being global. It relies specifically on `AuthService`, so putting it under `common/guards` would make `common` depend on a feature module. Create `common/guards` only when genuinely feature-neutral guards exist.

Keep generated Prisma output where it is. Changing the generator output creates import churn without improving the application architecture.

## Nest module boundaries

The dependency direction should be:

```text
AppModule
├── AuthModule ────────────────→ PrismaModule
├── CollectionsModule ─────────→ PrismaModule
├── BookmarksModule ───────────→ CollectionsModule + PrismaModule
└── SharesModule ──────────────→ CollectionsModule + PrismaModule
```

Responsibilities:

- `AuthModule`: `/me`, Auth0 verification, identity synchronization, and global authentication guard.
- `CollectionsModule`: collection CRUD and owner/access lookup methods. Export `CollectionsService`.
- `BookmarksModule`: bookmark CRUD plus `GET /collections/:id/bookmarks`.
- `SharesModule`: all `/collections/:id/share(s)` routes.
- `PrismaModule`: database connection only.
- `AppModule`: composition root and global exception-filter registration.

`CollectionsController` should stop injecting `BookmarksService` and `SharesService`. This removes the potential module cycle while preserving the exact HTTP contract.

## Current-file mapping

| Current file | Destination |
|---|---|
| `app.module.ts` | `src/app.module.ts` |
| `app.module.spec.ts` | `src/app.module.spec.ts` |
| `main.ts` | `src/main.ts` |
| `load-environment.ts` | `src/core/config/load-environment.ts` |
| `prisma.module.ts` | `src/core/database/prisma.module.ts` |
| `prisma.service.ts` | `src/core/database/prisma.service.ts` |
| `api-exception.filter.ts` | `src/common/filters/api-exception.filter.ts` |
| `api-exception.filter.spec.ts` | `src/common/filters/api-exception.filter.spec.ts` |
| `request-validation.ts` | `src/common/http/request-validation.ts` initially |
| `resource-access.ts` | `src/common/security/resource-access.ts` |
| `auth.contract.ts` | `src/modules/auth/auth.contract.ts` |
| `auth.guard.ts` | `src/modules/auth/auth.guard.ts` |
| `auth.service.ts` | `src/modules/auth/auth.service.ts` |
| `auth0.client.ts` | `src/modules/auth/auth0.client.ts` |
| `auth0.transport.ts` | `src/modules/auth/auth0.transport.ts` |
| `jose.loader.ts` | `src/modules/auth/jose.loader.ts` |
| `me.controller.ts` | `src/modules/auth/me.controller.ts` |
| `bookmarks.controller.ts` | `src/modules/bookmarks/bookmarks.controller.ts` |
| `bookmarks.service.ts` | `src/modules/bookmarks/bookmarks.service.ts` |
| Bookmark-related method from `collections.controller.ts` | New `modules/bookmarks/collection-bookmarks.controller.ts` |
| `collections.controller.ts` collection CRUD | `src/modules/collections/collections.controller.ts` |
| `collections.service.ts` | `src/modules/collections/collections.service.ts` |
| `shares.service.ts` | `src/modules/shares/shares.service.ts` |
| Share-related methods from `collections.controller.ts` | New `modules/shares/shares.controller.ts` |
| `auth.test-assertions.ts` | `test/support/auth.test-assertions.ts` |
| `auth.test-harness.ts` | `test/support/auth.test-harness.ts` |
| `auth.test-tokens.ts` | `test/support/auth.test-tokens.ts` |
| `resource.test-harness.ts` | `test/support/resource.test-harness.ts` |
| `generated/prisma/**` | Leave unchanged |

For the first migration, keep `request-validation.ts` intact. Splitting it into `bookmarks.validation.ts`, `collections.validation.ts`, and `shares.validation.ts` can happen later if it continues growing. Doing both reorganizations simultaneously would make verification harder.

## Safe migration steps

1. **Capture a clean baseline**

   Run the focused backend suite, full backend tests, typecheck, and build before moving anything. This distinguishes migration regressions from existing failures.

2. **Move test support out of production source**

   Move the four `*.test-*`/harness files into `test/support` and update E2E imports. This immediately stops test infrastructure from cluttering production code.

3. **Move infrastructure without changing behavior**

   Move the filter, environment loader, Prisma files, validation helpers, and `resource-access.ts`. Update imports mechanically and run typecheck.

   Keep `resource-access.ts` as the single shared source of owner/grantee Prisma predicates. Duplicating those predicates inside feature modules would risk privacy drift.

4. **Create `AuthModule`**

   Register:

   - `MeController`
   - `AuthService`
   - `Auth0Client`
   - `Auth0Transport`
   - `AUTH_CONFIG`
   - the `APP_GUARD` provider

   Import `PrismaModule`. Remove these declarations from `AppModule`.

5. **Create `CollectionsModule`**

   Register collection CRUD controller and service. Import `PrismaModule` and export `CollectionsService`, since bookmark and share rules call its authoritative `owned()` and `accessible()` checks.

6. **Create `BookmarksModule`**

   Import `PrismaModule` and `CollectionsModule`. Register `BookmarksController`, `CollectionBookmarksController`, and `BookmarksService`.

   Move only the existing `GET /collections/:id/bookmarks` handler into the new controller. Preserve its route, validation, response type, and owner-or-grantee behavior.

7. **Create `SharesModule`**

   Import `PrismaModule` and `CollectionsModule`. Register `SharesController` and `SharesService`.

   Move the four existing share handlers unchanged:

   - `POST /collections/:id/shares`
   - `GET /collections/:id/shares`
   - `DELETE /collections/:id/shares/:shareId`
   - `DELETE /collections/:id/share`

8. **Reduce `AppModule` to composition**

   It should primarily import the four feature modules. Keep global exception-filter registration here unless a second common global provider later justifies a `CommonModule`.

9. **Update imports mechanically**

   Initially retain relative imports; adding aliases such as `@modules/*` would require coordinated TypeScript, Jest, and runtime configuration for little gain at this repository size. Use `rg` to ensure no old flat imports remain.

10. **Fix build/test configuration**

   The current build includes `src/**/*.spec.ts`. Add a build-only exclusion for unit specs and remove Jest types from `tsconfig.build.json` if compilation permits. Keep Jest’s existing `src/**/*.spec.ts` match; nested unit specs will still be discovered.

11. **Verify privacy-sensitive paths**

   Run tests covering owner, active grantee, and outsider behavior for:

   - direct collection reads;
   - filtered and nested bookmark reads;
   - owner-only bookmark/collection writes;
   - share grant/list/revoke;
   - grantee leave;
   - sanitized `401`, `404`, and `503` responses.

12. **Update documentation with approval**

   Only `README.md` needs an expected update because its focused filter-test path will change. `API_DESIGN.md` and `DECISIONS.md` should remain unchanged because this migration must not alter HTTP or authorization behavior.

## Why this structure is better

- **Feature locality:** controllers, services, and providers that change together live together.
- **Explicit dependencies:** Nest module imports reveal feature coupling rather than hiding it in flat relative imports.
- **Safer authorization:** shared owner/grantee query predicates remain centralized and testable.
- **Cleaner builds:** production compilation no longer includes test harnesses and unit specs.
- **Scalable without ceremony:** new feature modules can be added independently, while unnecessary repository interfaces and generic base services are avoided.
- **Readable composition root:** `AppModule` describes the application instead of listing every provider.

No files were changed and no tests were run; this was a read-only architectural review.

<details><summary>20 previous messages</summary>

> I’m implementing the approved migration in small conventional commits. I’ll preserve all routes and authorization behavior, first establish the current baseline, then move infrastructure/test support, introduce acyclic feature modules, update documentation, and run the full repository gates.
>
> The baseline is green: the focused exception-filter test, backend typecheck, and backend build all pass. I’m now performing the first behavior-neutral commit: moving core/common code and test harnesses while keeping the existing provider graph intact.
>
> <details><summary>Edited 24 files</summary>
>
> - Wrote `./backend/src/api-exception.filter.spec.ts` (+0 -0)
> - Wrote `./backend/src/api-exception.filter.ts` (+1 -1)
> - Wrote `./backend/src/load-environment.ts` (+0 -0)
> - Wrote `./backend/src/prisma.module.ts` (+0 -0)
> - Wrote `./backend/src/prisma.service.ts` (+1 -1)
> - Wrote `./backend/src/request-validation.ts` (+0 -0)
> - Wrote `./backend/src/resource-access.ts` (+1 -1)
> - Wrote `./backend/src/auth.test-assertions.ts` (+0 -0)
> - Wrote `./backend/src/auth.test-harness.ts` (+4 -4)
> - Wrote `./backend/src/auth.test-tokens.ts` (+1 -1)
> - Wrote `./backend/src/resource.test-harness.ts` (+2 -2)
> - Wrote `./backend/src/app.module.spec.ts` (+1 -1)
> - Wrote `./backend/src/app.module.ts` (+2 -2)
> - Wrote `./backend/src/auth.service.ts` (+1 -1)
> - Wrote `./backend/src/bookmarks.controller.ts` (+1 -1)
> - Wrote `./backend/src/bookmarks.service.ts` (+3 -3)
> - Wrote `./backend/src/collections.controller.ts` (+1 -1)
> - Wrote `./backend/src/collections.service.ts` (+6 -3)
> - Wrote `./backend/src/main.ts` (+1 -1)
> - Wrote `./backend/src/shares.service.ts` (+2 -2)
> - Wrote `./backend/test/e2e/auth.errors.e2e.spec.ts` (+3 -3)
> - Wrote `./backend/test/e2e/auth.identity.e2e.spec.ts` (+3 -3)
> - Wrote `./backend/test/e2e/resources.e2e.spec.ts` (+3 -3)
> - Wrote `./backend/test/e2e/shares.e2e.spec.ts` (+3 -3)
>
> </details>
>
> The first commit is complete (`a578050`). The second phase now introduces the actual Nest boundaries. I’m keeping the authentication guard inside `AuthModule` and exporting only `CollectionsService`, which gives bookmarks and shares the ownership checks they need without making the whole application global.
>
> <details><summary>Created 6 files, edited 17 files</summary>
>
> - Wrote `./backend/src/auth.contract.ts` (+0 -0)
> - Wrote `./backend/src/auth.guard.ts` (+1 -1)
> - Wrote `./backend/src/auth.service.ts` (+2 -2)
> - Wrote `./backend/src/auth0.client.ts` (+0 -0)
> - Wrote `./backend/src/auth0.transport.ts` (+0 -0)
> - Wrote `./backend/src/common/filters/api-exception.filter.ts` (+1 -1)
> - Wrote `./backend/src/jose.loader.ts` (+0 -0)
> - Wrote `./backend/src/me.controller.ts` (+0 -0)
> - Wrote `./backend/test/support/auth.test-harness.ts` (+1 -1)
> - Wrote `./backend/test/support/auth.test-tokens.ts` (+1 -1)
> - Wrote `./backend/src/bookmarks.controller.ts` (+2 -2)
> - Wrote `./backend/src/bookmarks.service.ts` (+5 -5)
> - Wrote `./backend/src/collections.service.ts` (+4 -4)
> - Wrote `./backend/src/shares.service.ts` (+4 -4)
> - Wrote `./backend/src/collections.controller.ts` (+3 -61)
> - Wrote `./backend/src/app.module.ts` (+7 -26)
> - Wrote `./backend/src/modules/auth/auth.module.ts` (+22 -0)
> - Wrote `./backend/src/modules/bookmarks/bookmarks.module.ts` (+13 -0)
> - Wrote `./backend/src/modules/bookmarks/collection-bookmarks.controller.ts` (+18 -0)
> - Wrote `./backend/src/modules/collections/collections.module.ts` (+12 -0)
> - Wrote `./backend/src/modules/shares/shares.controller.ts` (+62 -0)
> - Wrote `./backend/src/modules/shares/shares.module.ts` (+12 -0)
> - Wrote `./backend/test/e2e/resources.e2e.spec.ts` (+1 -1)
>
> </details>
>
> The feature-module typecheck and unit tests pass. The build exposed one non-`src` caller that the initial import scan missed: `backend/prisma.config.ts` still imports the old environment-loader path. I’m correcting that root cause before committing this phase.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./backend/prisma.config.ts` (+1 -1)
>
> </details>
>
> The module commit is complete (`723528d`). I’m removing the redundant E2E aggregator now: Jest will discover each E2E file directly, which makes failures visible instead of producing only the experimental warning. This also lets the production build exclude unit specs and Jest globals cleanly.
>
> <details><summary>Edited 3 files, deleted a file</summary>
>
> - Wrote `./README.md` (+3 -7)
> - Wrote `./backend/package.json` (+1 -1)
> - Deleted `./backend/test/e2e/http.e2e.spec.ts` (+0 -4)
> - Wrote `./backend/tsconfig.build.json` (+4 -2)
>
> </details>
>
> Direct E2E discovery is fixed—Jest now lists all four suites—but the repository’s pre-existing Jest/VM-modules reporter issue still suppresses the pass/fail summary. I’m retaining that warning in the README rather than claiming the configuration change solved more than it did.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./README.md` (+4 -0)
>
> </details>
>
> All three conventional commits are in place. I’m at the completion audit now: full repository gate, direct E2E discovery, build-output inspection, stale-import search, final tree comparison, and clean-worktree verification.
>
> The full gate reached backend E2E execution, but the known reporter defect again ended the visible output before the remaining workspace/build steps. I’m collecting Jest’s machine-readable result and command exit status separately so completion is based on evidence rather than the missing console summary.
>
> The machine-readable run found a genuine regression from direct suite discovery: the Auth/Jose test harness intentionally shares one Jest environment, and separate suite environments reuse a dynamic import after teardown. The smallest correct recovery is to restore the E2E aggregator and keep only the production-build exclusion and moved test paths.
>
> <details><summary>Created a file, edited 2 files</summary>
>
> - Wrote `./README.md` (+2 -2)
> - Wrote `./backend/package.json` (+1 -1)
> - Wrote `./backend/test/e2e/http.e2e.spec.ts` (+4 -0)
>
> </details>
>
> The recovered E2E output narrows the failure to real-Prisma identity synchronization; all stubbed Auth0/identity tests still pass. I’m using a temporary focused diagnostic spec to surface the swallowed exception directly, then I’ll remove it before the next commit.
>
> <details><summary>Created a file</summary>
>
> - Wrote `./backend/src/resource-debug.spec.ts` (+24 -0)
>
> </details>
>
> The diagnostic found an environment issue, not an application regression: escalated commands used the default Node 24 runtime against dependencies installed for Node 22. I’m removing the diagnostic file and rerunning the aggregated E2E suite with the repository’s required Node 22.22.0 runtime.
>
> <details><summary>Deleted a file</summary>
>
> - Deleted `./backend/src/resource-debug.spec.ts` (+0 -24)
>
> </details>
>
> The recovery commit is complete (`e6b5b43`), and the required Node 22 aggregated E2E suite now passes all 27 tests, including owner, grantee, outsider, revoke, and leave paths. I’m rerunning the entire repository gate outside the port-restricted sandbox, then I’ll verify the final tree and commit history.
</details>

Implemented and committed the backend refactor. [backend/src](./backend/src) now uses `common`, `core`, and feature modules with acyclic nested-route controllers.

Commits:

- `a578050` core and test support
- `723528d` feature modules
- `c6090dd` E2E discovery attempt
- `e6b5b43` preserve shared E2E runtime

`npm run check` passes: 29 backend tests, 13 frontend tests, lint, typecheck, Prisma validation, and builds. Worktree is clean. Completed in about 16m 30s.
