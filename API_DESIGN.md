# API design

This file is the required entry point for the approved HTTP and authorization
contract. The full design is split by concern:

- [Core API](api-design/core.md) covers authentication, resources, collection
  visibility, update and deletion behavior, and privacy enforcement.
- [Collection sharing](api-design/sharing.md) covers grant, list, revoke, and
  leave operations plus their acceptance scenarios.
- [Error contract](api-design/errors.md) covers error envelopes, status codes,
  non-disclosure behavior, sanitization, and required evidence.

These files together form the authoritative API contract. Changes to any of
them require the same approval as changes to this index.

## Splitting contract files

If a linked API design file becomes difficult to navigate or mixes distinct
concerns, the agent may recommend splitting it. Before editing, the agent must
name the proposed files, sections to move, affected links, and confirm whether
the split is organizational only. The agent must wait for explicit user
approval.

After approval, preserve contract behavior, update the index and
cross-references atomically, and validate all local links. Any semantic change
requires separate approval.

## Agent proposals corrected during review

- The agent considered a backend-for-frontend Auth0 session. Review found that
  it added session and CSRF machinery without helping the approved public-SPA
  scope, so the user selected SPA-direct Authorization Code with PKCE.
- The initial collection relationship left deletion behavior to a future
  database choice. Review identified the resulting data-loss ambiguity, and
  the user chose an atomic unlink that preserves bookmarks.
- The agent initially deferred all cross-user access to protect privacy.
  Review separated the required sharing exception from general user browsing,
  producing the exact-email, read-only grant and grantee-only leave contract.

The accepted outcomes and rejected alternatives are recorded in
[DECISIONS.md](DECISIONS.md).
