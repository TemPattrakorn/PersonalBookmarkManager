# Collection sharing

[Back to the API design index](../API_DESIGN.md)

Creating, listing, and revoking another person's share are owner-only. The one
grantee-managed operation is deleting the authenticated person's own share
through the singular leave route.

## Create or repeat a grant

`POST /collections/:id/shares`

Request:

```json
{
  "email": "grantee@example.com"
}
```

A new grant returns `201 Created`. Repeating the same collection and grantee
returns `200 OK` with the existing grant and creates no duplicate.

Response:

```json
{
  "id": "share-id",
  "email": "grantee@example.com",
  "createdAt": "2026-07-30T00:00:00.000Z"
}
```

Malformed email and self-sharing return `400 Bad Request`. An unavailable
collection, or an email with zero, multiple, or no verified eligible matches,
returns the same generic `404 Not Found` response. The API provides no account
search, suggestions, names, invitation, notification, or shareable output.

## List current grants

`GET /collections/:id/shares`

The owner receives `200 OK` and a list of that collection's current grants in
the response shape above. This list is the only recipient-browsing surface and
contains exact granted emails but no names or unrelated accounts. A grantee,
outsider, or unavailable collection receives the generic `404 Not Found`.

## Revoke a grant

`DELETE /collections/:id/shares/:shareId`

The owner receives `204 No Content`. Revocation removes read access
immediately; subsequent shared list, direct, filtered, and nested reads return
the same results as if the grant had never existed. An unavailable collection
or grant returns the generic `404 Not Found`.

## Leave a shared collection

`DELETE /collections/:id/share`

The API deletes a `CollectionShare` only when its `collectionId` matches `:id`
and its `granteePersonId` is the authenticated person. The request contains no
grantee or share ID and can never delete another person's grant.

The endpoint is idempotent and always returns `204 No Content`, including when
the collection is owned by the caller, belongs to an outsider, does not exist,
or no matching share remains. This response prevents the leave operation from
revealing collection or grant existence.

After a successful leave, the collection no longer appears in
`GET /collections?scope=shared`, and subsequent direct, filtered, relation,
and nested reads use the generic `404 Not Found`. The collection, its
bookmarks, and every other grant remain unchanged. The owner may grant the
same person access again later; leaving creates no block or history record.

## Acceptance scenarios

Future automated tests must cover:

- creating a grant and repeating it without a duplicate;
- malformed email, self-sharing, and unknown, unverified, or ambiguous email;
- listing only the owner's current grantee emails;
- grantee collection, filtered bookmark, nested bookmark, and direct bookmark
  reads;
- denial of every grantee mutation and share-management operation;
- outsider non-disclosure across direct, list, filter, count, and nested paths;
- revocation removing all subsequent read access;
- leaving removing only the authenticated grantee's share while preserving the
  collection, bookmarks, and other grants;
- repeated leave, owner leave, outsider leave, and missing-ID leave all
  returning `204` without changing owner data;
- the owner granting access to the same person again after they leave;
- an email change leaving an existing stable-person grant intact; and
- collection deletion revoking shares while preserving bookmarks as private,
  uncategorized owner data.

These scenarios describe required future evidence; no runtime coverage exists
until application code and tests are implemented.
