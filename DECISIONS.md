# Decisions

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

## 2026-07-30 — Use email-addressed read-only collection sharing

**Decision:** A collection owner may grant live read access to exactly one
previously signed-in local person by entering that person's verified email.
The email is normalized only for lookup; the resulting `CollectionShare` is
bound to the grantee's stable local person ID, so a later email change does not
revoke access. A grantee may read the shared collection and the bookmarks
currently in it, but may not change, delete, or reshare anything. The owner may
list the exact emails already granted on that collection and revoke any grant.

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
