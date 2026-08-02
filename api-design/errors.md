# Error contract

[Back to the API design index](../API_DESIGN.md)

Every error response uses `application/json` and a normalized envelope. Most
errors contain only a numeric HTTP status and a string message:

```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

Validation errors may also contain field-level details:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "must be a non-empty string"
    }
  ]
}
```

`message` is always a string. Responses do not contain timestamps, request
paths, request IDs, exception names, stack traces, submitted values, database
details, or upstream-provider responses. Validation details identify only the
invalid field and rule; they never echo its value.

The API uses these status codes:

- `400 Bad Request` for malformed JSON, malformed path IDs, invalid query
  parameters, invalid body fields, an empty `PATCH`, unknown or read-only
  fields, and self-sharing;
- `401 Unauthorized` for a missing, malformed, expired, incorrectly issued,
  or otherwise invalid access token, an Auth0 `/userinfo` client `4xx` other
  than `429`, a subject mismatch, or missing usable identity claims;
- `404 Not Found` for a missing resource and every privacy-sensitive
  authorization or lookup failure;
- `415 Unsupported Media Type` when a route that accepts a body receives
  content that is not JSON;
- `500 Internal Server Error` for an unexpected application or database
  failure; and
- `503 Service Unavailable` when Auth0 discovery, JWKS, or `/userinfo` has a
  transport failure, timeout, rate limit, upstream `5xx`, or malformed
  response rather than rejecting the supplied credentials.

The API does not use `403 Forbidden` because it would distinguish an existing
but inaccessible resource. It does not use `409 Conflict` for repeat sharing,
which is idempotent, or `422 Unprocessable Content`, because request validation
uses `400`. Unsupported or unimplemented routes and methods use the
framework's normalized generic `404` response; the API adds no custom `405`
behavior.

Structurally invalid input is rejected before lookup with `400`. This includes
an invalid UUID, a pagination value outside the approved integer bounds, a
repeated or malformed query value, or an unknown query parameter. Once an
identifier or lookup value is structurally valid, failure of the
authorization-scoped lookup uses `404`. A missing resource, another owner's
resource, a grantee mutation attempt, an inaccessible collection filter, a
revoked or absent share, and a share-recipient lookup with zero, multiple, or
unverified eligible matches all return exactly:

```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

In particular, an inaccessible collection filter returns `404`, not an empty
list. Direct, filtered, relation, and nested queries enforce authorization in
the database lookup so the application does not first load a private resource
and then expose a distinguishable authorization failure.

All rejected credentials return `401` with `WWW-Authenticate: Bearer` and:

```json
{
  "statusCode": 401,
  "message": "Authentication required"
}
```

The response does not distinguish missing, expired, malformed, wrong-audience,
wrong-issuer, subject-mismatch, or unusable-profile credentials. An identified
Auth0 transport, timeout, rate-limit, upstream `5xx`, or malformed-response
failure returns the sanitized `503` response instead:

```json
{
  "statusCode": 503,
  "message": "Service unavailable"
}
```

Unexpected failures return only:

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

Application logs must not contain access tokens, request bodies, emails,
bookmark URLs or notes, database details, or other sensitive personal data.
`backend/test/e2e/http.e2e.spec.ts` compares the exact `404` response across
missing, cross-user, filtered, nested, revoked-share, and mutation paths; it
also covers common `401`, malformed-request `400`, and sanitized `500` and
`503` authentication failures. The filter unit test covers the normalized
unsupported-media-type response.
