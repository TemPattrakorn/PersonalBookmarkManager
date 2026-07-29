# Backend agent rules

The repository-root `AGENTS.md` applies here. This file adds backend-specific
rules only.

## Stack and contract

- Use Node.js, TypeScript, NestJS, Prisma, and SQL persistence.
- Follow `API_DESIGN.md`; do not invent missing request, response, filtering,
  validation, status-code, `PUT`, or `PATCH` semantics.
- Authenticate every route with Auth0 OIDC using the approved tenant details.
  Do not guess configuration that has not been provided.
- Implement `/me`, `/collections`, `/bookmarks`, and
  `/collections/:id/bookmarks` only as approved. Each resource must support
  the required get-one, list, create, update, patch, delete, and filtering
  operations.

## Tenant isolation

- Obtain the current person from the verified token subject and resolve any
  local person record server-side.
- Set ownership during creation from that identity; never from request data.
- Scope Prisma reads and writes by both resource identity and current person.
  An ID-only lookup followed by an authorization check is not the default.
- Apply the same ownership scope to filters, counts, relations, nested routes,
  updates, and deletes.
- When assigning a bookmark to a collection, verify that the collection
  belongs to the same current person. `null` means uncategorized.
- Keep cross-user response behavior consistent with the approved API contract
  so it cannot reveal whether a resource exists.

## Data and tests

- Persist every route through Prisma; do not substitute in-memory state.
- Do not choose cascade, restrict, or nullification behavior for collection
  deletion until it is approved in `DECISIONS.md` and `API_DESIGN.md`.
- Seed at least two distinct users with separate collections and bookmarks.
- For every affected operation, test the allowed owner's path and denial of a
  second user's direct, filtered, and nested access.
- Run focused backend tests, then the applicable full test, lint, typecheck,
  and build commands before handoff.

Prefer existing NestJS and Prisma patterns. Add no repository layer, generic
service abstraction, or dependency unless the approved requirement needs it.
