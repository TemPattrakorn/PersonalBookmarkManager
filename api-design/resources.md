# Resource API

[Back to the API design index](../API_DESIGN.md)

## Resource representations

`GET /me` returns `200 OK` with only the current person's Auth0 email. It does
not expose verification state:

```json
{
  "email": "person@example.com"
}
```

A collection response is:

```json
{
  "id": "6b825df4-3f67-4a99-a4df-f97e54ae8b95",
  "name": "Engineering",
  "access": "owner",
  "createdAt": "2026-07-31T00:00:00.000Z",
  "updatedAt": "2026-07-31T00:00:00.000Z"
}
```

A bookmark response is:

```json
{
  "id": "cdb9d96a-c21c-4e50-978d-2c545ef49d3f",
  "url": "https://example.com/article",
  "title": "Example article",
  "notes": null,
  "collectionId": "6b825df4-3f67-4a99-a4df-f97e54ae8b95",
  "access": "owner",
  "createdAt": "2026-07-31T00:00:00.000Z",
  "updatedAt": "2026-07-31T00:00:00.000Z"
}
```

`access` is `"owner"` for an owned resource and `"viewer"` for a resource
read through an active share. Responses never expose an owner subject, person
ID, email, or other profile data. Timestamps are UTC ISO 8601 strings.

## Collection operations

`POST /collections` accepts exactly:

```json
{
  "name": "Engineering"
}
```

The server derives `ownerId`. A successful create returns `201 Created` with
the collection response. `GET /collections` returns `200 OK` with a paginated
array of owned collection responses and is equivalent to `scope=owned`.
`GET /collections/:id` returns `200 OK` with one collection response when the
caller is its owner or an active grantee.

`PATCH /collections/:id` accepts exactly a partial object containing `name`.
A successful owner update returns `200 OK` with the updated collection.
`DELETE /collections/:id` has the behavior specified under
[Delete a collection](#delete-a-collection).

## Bookmark operations

`POST /bookmarks` accepts exactly:

```json
{
  "url": "https://example.com/article",
  "title": "Example article",
  "notes": null,
  "collectionId": null
}
```

`url` and `title` are required. `notes` and `collectionId` are optional and
default to `null`. A non-null collection must belong to the current person.
The server derives `ownerId`. A successful create returns `201 Created` with
the bookmark response.

`GET /bookmarks` returns `200 OK` with a paginated array. Without a filter it
contains only the current person's bookmarks. It accepts no filter other than
an optional exact UUID `collectionId`. When `collectionId` is supplied, the
response may contain bookmarks in that exact collection when the caller is
its owner or an active grantee. An inaccessible collection filter returns the
generic `404`, not an empty array. Omitting the filter never includes bookmarks
owned by another person, even when their collections are shared.

`GET /bookmarks/:id` returns `200 OK` for the owner or an active grantee of the
bookmark's current collection. `GET /collections/:id/bookmarks` returns
`200 OK` with the same paginated array shape for bookmarks currently in the
specified accessible collection; it accepts only `limit` and `offset`.

`PATCH /bookmarks/:id` accepts exactly a partial object containing one or more
of `url`, `title`, `notes`, and `collectionId`. A successful owner update
returns `200 OK` with the updated bookmark. `DELETE /bookmarks/:id` is
owner-only and returns `204 No Content` without a response body.

## Input validation

Request bodies must be JSON objects and contain only the fields named for the
route. Collection names are trimmed, stored trimmed, non-empty, and at most
100 characters. Bookmark titles follow the same rules with a 200-character
maximum. Bookmark URLs are trimmed and stored with the remaining text
unchanged; they may be at most 2,048 characters and must parse as an absolute
HTTP or HTTPS URL.

Notes may be `null` or a string containing at least one non-whitespace
character and at most 5,000 characters. Non-null notes are stored unchanged.
Omitting notes during create stores `null`; `notes: null` during patch clears
them. Omitting `collectionId` during create stores `null`; an explicit `null`
during create or patch makes the bookmark uncategorized.

An unknown or read-only field, invalid type, invalid value, or empty patch
returns `400 Bad Request`. Create bodies must include every required field.
Supplying `null` for any field other than bookmark `notes` or `collectionId`
returns `400 Bad Request`.

## Update semantics

`PATCH` is the only update verb; there are no `PUT` endpoints.
`PATCH /collections/:id` accepts a partial collection body, and
`PATCH /bookmarks/:id` accepts a partial bookmark body. Omitted editable
fields keep their current values. Every supplied field is validated; an empty
body, an unknown or read-only field, or a malformed value returns
`400 Bad Request`.

`bookmark.collectionId` may be explicitly `null` to make the bookmark
uncategorized. A non-null collection ID must identify a collection owned by
the authenticated person; an unavailable or other person's collection returns
the generic `404 Not Found`. A successful patch returns `200 OK` with the
updated resource. A bookmark or collection not owned by the caller, including
one owned by another person, also returns that same generic `404 Not Found`.

## Delete a collection

`DELETE /collections/:id` requires a verified Auth0 access token. The API
derives the person from that token and scopes the lookup and mutation to that
person's collection; it never accepts an owner ID from the request.

On success, the API atomically deletes the collection and its share rows and
sets `collectionId` to `null` for bookmarks owned by the authenticated person
that belonged to it. It returns `204 No Content` with no response body.
Bookmarks are neither deleted nor returned, and the response does not include
an unlink or revoked-share count.

If no collection with that ID belongs to the authenticated person, including
when the ID belongs to someone else, the API returns the same `404 Not Found`
response. This prevents callers from inferring another person's collection.

## Automated evidence

`backend/test/e2e/http.e2e.spec.ts` covers owner collection and bookmark CRUD,
pagination, collection filtering, nested reads, uncategorized behavior,
collection deletion/unlinking, invalid collection assignment, and exact generic
`404` responses for outsiders and unauthorized mutations. The suite also
exercises a share revoked between an accessible collection lookup and its
bookmark query, so filtered and nested reads do not rely on stale authorization.
