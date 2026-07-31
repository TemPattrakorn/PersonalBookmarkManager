# Backend agent rules

The repository-root `AGENTS.md` applies here. This file adds backend-specific
rules only.

## Stack and contract

- Use Node.js, TypeScript, NestJS, Prisma, and SQL persistence.
- Follow `API_DESIGN.md`; do not invent missing request, response, filtering,
  validation, status-code, `PUT`, or `PATCH` semantics.
- Authenticate every route by validating Auth0 access tokens against:
  - discovery: `https://dev-yg.us.auth0.com/.well-known/openid-configuration`;
  - audience: `https://bbl-candidate-test-api`;
  - required scopes requested by the client: `openid profile email`.
- The discovery URL and audience are public configuration. Do not add or
  require a client secret for the public SPA.
- Implement `/me`, `/collections`, `/bookmarks`,
  `/collections/:id/bookmarks`, and `/collections/:id/shares` only as
  approved. Each resource must support only the verbs and filtering operations
  recorded in `API_DESIGN.md`.

## Tenant isolation

- Obtain the current person from the verified token subject and resolve any
  local person record server-side.
- Set ownership during creation from that identity; never from request data.
- Scope Prisma writes by both resource identity and owner. Scope approved
  shared reads by owner or active `CollectionShare` in the database query; an
  ID-only lookup followed by an authorization check is not the default.
- Apply the same owner-or-grantee read rule to direct, filtered, relation, and
  nested reads. Keep all updates, patches, deletes, and share management
  owner-only.
- When assigning a bookmark to a collection, verify that the collection
  belongs to the same current person. `null` means uncategorized.
- Resolve a share recipient only from a normalized, verified email belonging
  to exactly one previously signed-in local person. Use Auth0 `/userinfo` to
  establish that email and match its `sub` to the verified token principal;
  never trust client-supplied profile data.
- Keep cross-user response behavior consistent with the approved API contract
  so it cannot reveal whether a resource exists.

## Data and tests

- Persist every route through Prisma; do not substitute in-memory state.
- Start from the brief's suggested fields:
  - person: `id`, unique Auth0 subject, email, normalized email, verification
    state, `createdAt`, `updatedAt`;
  - collection: `id`, `name`, `ownerId`, `createdAt`, `updatedAt`;
  - bookmark: `id`, `url`, `title`, optional `notes`, nullable
    `collectionId`, `ownerId`, `createdAt`, `updatedAt`.
  - collection share: `id`, `collectionId`, `granteePersonId`, `createdAt`,
    unique on collection and grantee.
- This data shape is guidance, not a settled schema. Any refinement requires
  rationale and approval in `DECISIONS.md`.
- Preserve the approved collection deletion behavior: nullify its bookmark
  references and delete its share rows atomically.
- Seed at least three distinct users so owner, grantee, and outsider behavior
  can be tested.
- For every affected operation, test the allowed owner path, any approved
  grantee read, and denial of outsider and grantee writes across direct,
  filtered, and nested access.
- Run focused backend tests, then the applicable full test, lint, typecheck,
  and build commands before handoff.

Prefer existing NestJS and Prisma patterns. Add no repository layer, generic
service abstraction, or dependency unless the approved requirement needs it.
