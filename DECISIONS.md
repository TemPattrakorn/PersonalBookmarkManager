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
