# Decisions

## 2026-07-29 — Use SPA-direct Auth0 authentication

**Status:** Accepted

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

## 2026-07-29 — Preserve bookmarks when deleting a collection

**Status:** Accepted

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
