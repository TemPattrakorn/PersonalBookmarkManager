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
