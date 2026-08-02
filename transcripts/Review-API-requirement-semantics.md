# Review API requirement semantics

> Go over "filtering, pagination, validation, and error semantics" Under-specified requirements in [AGENTS.md](AGENTS.md)

<details><summary>1 previous message</summary>

> I’ll compare that requirement against the project’s approved API and decision records, then summarize the concrete choices that are already settled versus anything still needing approval.
</details>

The documents settle some filtering, validation, and error rules, but pagination and several details remain unapproved.

| Area | Already approved | Still under-specified |
|---|---|---|
| Filtering | `GET /collections` defaults to owned; `scope=shared` is allowed. Bookmark lists are owner-only unless filtering by an actively shared collection. | Exact bookmark filter parameter(s), uncategorized-bookmark filter, combining filters, and invalid-filter behavior beyond generic `400`. |
| Pagination | Nothing. | Whether lists return all results, use offset/limit, or cursor pagination; defaults, maximums, ordering, and response shape. |
| Validation | `PATCH` is partial; empty, unknown/read-only, and malformed fields are `400`; `collectionId: null` explicitly uncategorizes. | Field constraints (title/name lengths, URL scheme/length, whitespace normalization), ID format, duplicate handling, query validation, and create-body requirements. |
| Errors | Unauthorized/unavailable resources must be indistinguishable with generic `404`; malformed input is `400`; successful delete is `204`. | The shared JSON error envelope, malformed JSON/content-type handling, auth failure status/body, validation-error detail, and list/query error shape. |

My recommendation before implementation:

- Use `GET /bookmarks?collectionId=<id>` only for collection-scoped reads; omit it for the caller’s own bookmarks. Keep uncategorized bookmarks in the owner-only default list unless a separate `uncategorized=true` filter is explicitly approved.
- Use simple `limit` + `offset` pagination with stable `createdAt DESC, id DESC` ordering, a small default/max, and `{ items, page: { limit, offset, total } }`. `total` must be calculated only after the authorized query, so it cannot reveal unshared data.
- Define one validation matrix for create and patch fields, and reject invalid query keys/values with `400`.
- Define one global envelope such as `{ "statusCode": 400, "message": "Invalid request" }`; do not expose validation internals or resource-existence differences in `404`s.

No code or documentation was changed. The current [API design](./API_DESIGN.md) needs these decisions recorded before implementation.

> I agree with your recommendation on Filtering, Pagination and Validation. Let's go in detail in Errors

<details><summary>1 previous message</summary>

> I’m using the active Ponytail guidance to keep the error contract small and uniform. I’ll inspect the backend conventions first, then lay out the viable choices, security consequences, and a recommended exact contract for your approval—no files will be changed.
</details>

The best fit is a small, normalized error contract instead of exposing NestJS’s default responses. Nest defaults can vary between exceptions—especially validation errors—making the frontend and privacy tests brittle.

## Recommended envelope

Most errors:

```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

Validation errors may add field-level details:

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

Keep `message` consistently a string. Do not add timestamps, request paths, stack traces, exception names, submitted values, or request IDs yet.

## Recommended status semantics

| Status | Use |
|---|---|
| `400 Bad Request` | Malformed JSON, malformed path IDs, invalid query parameters, invalid fields, empty `PATCH`, unknown/read-only fields, or self-sharing |
| `401 Unauthorized` | Missing, malformed, expired, incorrectly issued, or otherwise invalid access token |
| `404 Not Found` | Missing resources and privacy-sensitive authorization failures |
| `415 Unsupported Media Type` | A body-bearing route receives content that is not JSON |
| `500 Internal Server Error` | Unexpected application or database failure |
| `503 Service Unavailable` | Auth0/JWKS/UserInfo is temporarily unavailable, rather than rejecting the supplied credentials |

I recommend deliberately not using:

- `403`: it would distinguish an existing but forbidden resource.
- `409`: repeated sharing is already idempotent; there is no other approved business conflict.
- `422`: all request validation remains under `400`.
- Custom handling for `405`: unsupported routes or verbs can use the framework’s generic `404`.

## The important `400` versus `404` boundary

Use `400` when the request is structurally invalid before any resource lookup:

```text
collectionId=hello              → 400
limit=-5                        → 400
unknown query parameter         → 400
PATCH with an empty body        → 400
```

Use `404` after a structurally valid identifier or email lookup fails the authorized query:

```text
valid UUID, resource missing              → 404
valid UUID, belongs to an outsider        → 404
valid UUID, grantee attempts mutation     → 404
valid collection filter without access    → 404
share email has zero eligible matches     → 404
share email has multiple matches          → 404
share email belongs to an unverified user → 404
```

A filtered bookmark request for an inaccessible collection should return `404`, not an empty list. Otherwise, filter behavior could differ depending on whether the collection exists or whether a share was revoked.

## Exact privacy behavior

All privacy-sensitive `404` responses should have the same status and body:

```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

That applies to:

- nonexistent resources;
- another owner’s resources;
- revoked or absent shares;
- grantee mutation attempts;
- invalid nested-resource relationships;
- unavailable share recipients.

The response must not include the resource type, identifier, owner, recipient email, or failure reason.

The implementation should enforce this by querying within the caller’s authorized scope, not by loading a resource first and throwing a different authorization error afterward. Artificial timing padding is unnecessary; scoped database queries are the appropriate protection.

## Authentication errors

All rejected credentials should use:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer
Content-Type: application/json
```

```json
{
  "statusCode": 401,
  "message": "Authentication required"
}
```

Do not distinguish missing, expired, malformed, wrong-audience, or wrong-issuer tokens in the response. Auth0 infrastructure failure should be `503`, because the caller’s credentials were not necessarily invalid.

## Internal failures

Unexpected failures should return only:

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

Database constraint names, Prisma errors, SQL, stack traces, Auth0 responses, access tokens, emails, bookmark URLs, notes, and request bodies must never appear in the response or routine logs.

## Minimum evidence

Tests should establish:

- exact equality between missing-resource and cross-user `404` responses;
- the same `404` across direct, filtered, nested, revoked-share, and mutation paths;
- identical `401` bodies for common credential failures;
- validation responses never echo submitted values;
- unexpected internal exceptions produce a sanitized `500`;
- upstream Auth0 outages produce a sanitized `503`.

My recommendation is to approve this contract as written and record it in [API_DESIGN.md](./API_DESIGN.md). No files have been changed.

> I approve this contract. Record it in [API_DESIGN.md](API_DESIGN.md)

<details><summary>1 previous message</summary>

> I’m applying Ponytail to keep this a documentation-only change: one exact error-contract section in `API_DESIGN.md`, with no speculative machinery. I’ll first check the current diff and insertion point, then present the required edit plan for approval before touching the file.
</details>

Plan:

- Add one `Error contract` section to [API_DESIGN.md](./API_DESIGN.md) covering the approved envelopes, status mapping, `400`/`404` boundary, authentication, sanitization, and required tests.
- Preserve the identical generic `404` response across all privacy-sensitive paths.
- Replace the existing “will be defined” placeholder with a reference to the new contract.
- Change no code or other documentation; verify the final diff and internal consistency.

`API_DESIGN.md` currently has no uncommitted changes. Approve this edit plan and I’ll apply it.

> Yes, Implement this plan

<details><summary>3 previous messages</summary>

> I’m adding only the approved contract and replacing the placeholder reference. Afterward I’ll inspect the rendered section and the exact Git diff; no runtime checks are needed for this documentation-only change.
>
> The patch missed because the surrounding line wrap differs from the earlier excerpt. Nothing changed; I’m narrowing the patch to the section headings so it won’t disturb nearby text.
>
> <details><summary>Edited a file</summary>
>
> - Wrote `./API_DESIGN.md` (+113 -3)
>
> </details>
</details>

Recorded the approved error contract in [API_DESIGN.md](./API_DESIGN.md:77) and replaced the old placeholder.

Verified with `git diff --check`; no code tests were needed for this documentation-only change.

> [API_DESIGN.md](API_DESIGN.md) are too long right now. seperate the content inside and put inside new folder call api design.

<details><summary>1 previous message</summary>

> I’ll keep the required root `API_DESIGN.md` as the entry point—the repository rules explicitly require that filename—and determine the smallest clean split. I’m using Ponytail to avoid turning the documentation into a maze; I’ll inspect the current section structure and propose exact filenames before editing.
</details>

To preserve the repository’s required root `API_DESIGN.md`, I recommend making it a short index and moving the authoritative sections into `api-design/` (hyphenated to avoid awkward paths with spaces):

- `api-design/core.md` — authentication, resources, visibility, updates, deletion, privacy
- `api-design/sharing.md` — sharing routes and acceptance scenarios
- `api-design/errors.md` — the approved error contract
- `API_DESIGN.md` — overview and links to all three files

Content and security semantics will remain unchanged. I’ll verify links, headings, `git diff --check`, and that no sections are lost.

Approve this split and folder spelling (`api-design/`), and I’ll implement it.

> Yes. I approve this split

<details><summary>3 previous messages</summary>

> I’m implementing the approved three-file split now. The root document will remain the required entry point, and I’ll preserve the current contract—including the uncommitted error section—while adding only relative links between the split files.
>
> <details><summary>Created 4 files, deleted a file</summary>
>
> - Wrote `./api-design/core.md` (+102 -0)
> - Wrote `./api-design/errors.md` (+112 -0)
> - Wrote `./api-design/sharing.md` (+98 -0)
> - Deleted `./API_DESIGN.md` (+0 -308)
> - Wrote `./API_DESIGN.md` (+14 -0)
>
> </details>
>
> The split is in place. I’m checking the index links, section inventory, whitespace, and diff now to confirm the move did not alter the approved behavior.
</details>

Split the 308-line API design into:

- [API_DESIGN.md](./API_DESIGN.md) — 14-line index
- [core.md](./api-design/core.md)
- [sharing.md](./api-design/sharing.md)
- [errors.md](./api-design/errors.md)

All approved behavior was preserved. Links and `git diff --check` pass; no runtime tests were needed.
