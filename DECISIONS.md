# Decisions

## Authentication

## 2026-07-29 — Use SPA-direct Auth0 authentication

**Decision:** The React SPA will use Auth0's Authorization Code flow with
PKCE (`S256`). It will send the resulting access token to the NestJS API as a
Bearer token. NestJS must verify the token and derive the authenticated person
from its verified principal; it remains solely responsible for enforcing
collection and bookmark ownership on every data-access path.

**Context:** The configured callback and logout URLs target `localhost:3000`,
which aligns with the SPA-direct setup (though a backend could also run on that
port). A BFF was considered because it would keep OAuth tokens off the
browser.

**Alternatives and tradeoffs:** A NestJS BFF could own the Auth0 callback,
token exchange, and an `HttpOnly` session cookie. That offers a tighter token
boundary, but adds session lifecycle, CSRF, callback, and server-side token
handling work and tests. For this take-home project's available time and
scope, that cost is not justified.

**Agent direction:** The review explicitly separated the generated
SPA-direct plan from the initially considered BFF design. The user chose the
original SPA-direct plan; do not introduce BFF/session infrastructure unless a
later approved decision replaces this one.

## 2026-08-02 — Cache successful Auth0 synchronization per access token

**Decision:** The first authenticated API request for an exact Auth0 access
token verifies it, loads `sub`, `email`, and `email_verified` from `/userinfo`,
requires the two subjects to match, and upserts the local person by Auth0
subject. Concurrent requests with that token share the active work. After
success, later requests with the exact token reuse the synchronized person only
until the token's verified `exp`; an expired token is never served from the
cache. Failures are removed immediately and are never cached. Different tokens
never share authentication work or results.

A person with an unverified email may use private features but remains
ineligible as a share recipient. The API does not link accounts by email or
expose verification state through `GET /me`. Profile changes become visible
when Auth0 issues a different access token rather than on every API request.

Credential and unusable-profile failures return the same sanitized `401`.
Auth0 discovery, JWKS, or `/userinfo` transport failures, timeouts, rate
limits, upstream `5xx` responses, and malformed upstream data return the same
sanitized `503`.

The in-memory coordination and cache key is a SHA-256 digest of the
authorization header; raw tokens are neither stored as keys nor logged.

**Alternatives and tradeoffs:** Rejecting unverified people entirely would
make email verification a prerequisite for private bookmark use. Synchronizing
on every request kept profile data freshest, but made each page reload depend
again on Auth0 and Prisma; active-promise sharing alone still exposed every
later request batch to that failure. A fixed-duration cache adds an arbitrary
freshness interval. Binding reuse to the already verified token lifetime gives
the cache a security-relevant expiry without adding configuration, at the cost
of profile data remaining unchanged for that token's lifetime.

**User opinion and agent direction:** After live retries showed that
active-promise sharing did not make sequential reloads reliable, the user
approved successful-result reuse for the exact verified token. Do not cache a
failure, serve a cached result at or after `exp`, share results between tokens,
reject private use solely for an unverified email, or expose verification state
without a new approved decision.

## Resource lifecycle

## 2026-07-29 — Preserve bookmarks when deleting a collection

**Decision:** Deleting an authenticated person's collection deletes only that
collection. Its bookmarks remain owned by that person and become
uncategorized (`collectionId = null`). The delete and unlink must be atomic.

**Context:** A collection has a nullable bookmark relationship. The product
needs a defined outcome when an owner deletes a collection that contains
bookmarks, without weakening private ownership.

**Alternatives and tradeoffs:** Blocking deletion until the collection is
empty avoids changing bookmarks but adds a manual cleanup step. Cascading the
deletion removes associated bookmarks but risks unintended data loss. Keeping
the bookmarks while clearing their collection reference preserves user data
with the smallest behavior change.

**Agent direction:** The agent presented blocking deletion, cascade deletion,
and unlinking as explicit alternatives rather than choosing a database default.
The user selected unlinking; do not add deletion counts, sharing behavior, or
bookmark deletion as part of collection deletion.

## Sharing model

## 2026-07-30 — Use email-addressed read-only collection sharing

**Decision:** A collection owner may grant live read access to exactly one
previously signed-in local person by entering that person's verified email.
The email is normalized only for lookup; the resulting `CollectionShare` is
bound to the grantee's stable local person ID, so a later email change does not
revoke access. A grantee may read the shared collection and the bookmarks
currently in it, but may not change, delete, or reshare anything. The owner may
list the exact emails already granted on that collection and revoke any grant.

The submitted email is trimmed before validation and lookup. The trimmed value
must be a string from 3 through 254 characters, contain exactly one `@`, have
non-empty local and domain parts, and contain no whitespace. Lowercasing is
used only for lookup; no provider-specific rewriting is applied.

Sharing is automatic when the submitted email uniquely matches an eligible
account. Repeating the same grant is idempotent. There is no user directory,
name browsing, shareable link, copy, role, pending invitation, notification,
or public access.

**Context:** The requirement that a user may want to share a collection was
interpreted as live visibility of that collection and its bookmarks. The
recipient should see it in a separate "Shared by others" section while all
other data remains private.

**Alternatives and tradeoffs:** Keeping sharing deferred preserves the
creator-only model but does not satisfy live sharing. Snapshot copies avoid
ongoing authorization but do not stay synchronized. Capability links are easy
to forward and are not identity-bound. Viewer/editor roles add ownership and
mutation questions that read-only access does not need. Looking up every Auth0
account would require privileged Management API credentials; limiting grants
to previously signed-in local people uses the existing SPA-direct setup.

**Agent direction:** The agent initially kept all cross-user access deferred
under the repository invariant. The user narrowed the exception to automatic,
exact-email, read-only live sharing and rejected browsable recipients and
copyable output. Do not expand this model without another approved decision.

## 2026-07-31 — Let a grantee leave an automatically shared collection

**Decision:** A grantee may leave a shared collection by deleting only their
own `CollectionShare`. Leaving never deletes or changes the collection, its
bookmarks, or another person's share. The action is idempotent and returns no
information about whether a matching collection or share exists. The owner may
grant access to the same person again later.

Owner deletion and grantee departure are deliberately separate operations.
The owner deletes the collection with `DELETE /collections/:id`; a grantee
leaves with `DELETE /collections/:id/share`. The UI must label these actions
"Delete collection" and "Leave shared collection" respectively.

**Context:** Automatic sharing already gives the recipient immediate read
access. The grantee still needs a simple way to remove unwanted shared content
without an invitation workflow or any effect on owner data.

**Alternatives and tradeoffs:** Accept/decline would add pending state,
transitions, invitation UI, race cases, and more tests. Retaining declined or
blocked states would prevent repeated sharing but adds policy and storage that
the current requirement does not need. A local hide action would leave server
authorization active and make "leave" misleading.

**User opinion and agent direction:** The user chose immediate sharing with a
grantee-controlled leave action because it satisfies the under-specified
requirement with less implementation effort and less testing than the other
options. Do not add acceptance, decline history, blocking, or notification
state without another approved decision.

## Update and persistence contract

## 2026-07-31 — Use partial PATCH updates only

**Decision:** Collections and bookmarks use owner-only `PATCH` endpoints for
updates. A request changes only its supplied editable fields; omitted fields
remain unchanged. `PUT` endpoints are not provided. A bookmark may be made
uncategorized only by explicitly supplying `collectionId: null`.

**Context:** The API needed an explicit update contract before implementation.
Partial edits are the natural fit for the UI and avoid forcing clients to send
unchanged data that could overwrite a newer value.

**Alternatives and tradeoffs:** Full-replacement `PUT` makes missing-field
behavior depend on the client and risks accidental data loss. Supporting both
verbs creates two update contracts without a current use for either
difference. `PATCH` needs clear rules for omitted fields and explicit nulls,
which the API design records.

**User opinion and agent direction:** The agent recommended `PATCH` only; the
user approved it. Do not add `PUT`, JSON Patch operations, or a generic
clear-on-null rule without another approved decision.

## 2026-07-31 — Use SQLite with UUID resource identifiers

**Decision:** The application will use SQLite through Prisma. Every persisted
resource uses a UUID primary key. Auth0 subject is unique; normalized email is
deliberately not unique so ambiguous recipient matches can be rejected without
linking accounts. A collection-grantee share pair is unique. Foreign keys and
indexes cover ownership, collection membership, and grantee lookups.

The initial schema uses only the person, collection, bookmark, and collection
share fields listed in `backend/AGENTS.md`. There is no person deletion API.
Collection deletion remains the explicit atomic operation already approved:
unlink its owner's bookmarks, delete its shares, and delete the collection.

**Alternatives and tradeoffs:** PostgreSQL offers closer production parity but
adds a service and configuration burden that this take-home does not need.
Integer IDs are shorter but expose creation order; CUIDs would also work but
provide no useful advantage over standard UUIDs here.

**User opinion and agent direction:** The user approved SQLite and UUIDs as
the smallest SQL-backed implementation. Do not add another database, public
IDs, soft deletion, or speculative schema fields without a new decision.

## 2026-07-31 — Use a minimal bounded CRUD contract

**Decision:** List endpoints return plain arrays without counts. They accept
`limit` and `offset`, defaulting to `50` and `0`; `limit` may not exceed `100`.
Results are ordered by `createdAt` descending and then UUID descending. The
only collection filter is `scope=owned|shared`, and the only bookmark filter
is an exact `collectionId`. Unknown filters are invalid.

Collection names are trimmed non-empty strings of at most 100 characters.
Bookmark titles are trimmed non-empty strings of at most 200 characters.
Bookmark URLs are trimmed, otherwise preserved, limited to 2,048 characters,
and must use HTTP or HTTPS. Notes are nullable and limited to 5,000 characters;
omission on create stores `null`, and explicit `null` on patch clears them.
An omitted or `null` bookmark collection on create makes it uncategorized.

Create operations return `201`, reads and patches return `200`, and deletes
return `204` without a body. Collection and bookmark responses include their
UUID, editable fields, timestamps, and `access`, but never an owner or person
identifier. `GET /me` returns only the authenticated person's Auth0 email.

**Alternatives and tradeoffs:** Cursor pagination scales better during heavy
concurrent writes but adds cursor and response metadata with no current need.
Response envelopes and total counts add client structure and create another
privacy-sensitive value. Full-text search, additional filters, and preserving
blank note values expand behavior without supporting the approved core UI.

**User opinion and agent direction:** The user approved these exact defaults.
Do not add counts, cursor pagination, search, new filters, or wider response
fields without a new approved decision.
