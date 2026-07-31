# API design

## Authentication and local identity

Every route requires a verified Auth0 access token. The API derives the current
person from the verified `sub`; it never accepts a person or owner ID from
request data as authority.

The API obtains `email` and `email_verified` from Auth0 `/userinfo`, verifies
that the returned `sub` matches the access-token principal, and stores the
profile on the local person. Email matching trims surrounding whitespace and
compares lowercase values without provider-specific rewriting. Email is only
a share-recipient lookup key: authorization is stored against the stable local
person ID, and accounts are never linked by email.

Only a verified email matching exactly one previously signed-in local person
is eligible for sharing. Zero, multiple, or unverified matches all use the
same generic `404 Not Found` behavior.

Reference: <https://auth0.com/docs/api/authentication/user-profile/get-user-info/>

## Resources

`CollectionShare` contains:

- `id`
- `collectionId`
- `granteePersonId`
- `createdAt`

The `(collectionId, granteePersonId)` pair is unique. A share has no role:
every grantee is a viewer. Deleting a collection deletes its shares. A grant
continues to identify the same person if that person's verified email changes.

Collection and bookmark responses include `access: "owner" | "viewer"`.
Shared responses do not expose the owner's profile, email, or person ID.

## Collection visibility

`GET /collections` returns only collections owned by the authenticated person.
This is equivalent to `GET /collections?scope=owned`.

`GET /collections?scope=shared` returns only collections with an active share
for the authenticated person. These collections populate the "Shared by
others" section. Other scope values return `400 Bad Request`.

`GET /collections/:id` permits the owner or an active grantee. An outsider
receives the same `404 Not Found` response as for a nonexistent collection.

`GET /collections/:id/bookmarks` permits the collection owner or an active
grantee and returns only bookmarks currently assigned to that collection.
`GET /bookmarks/:id` applies the same rule to a bookmark in a shared
collection. An unfiltered `GET /bookmarks` remains owner-only; a collection
filter may return shared bookmarks only when the authenticated person has an
active grant for that exact collection.

All collection and bookmark create, update, patch, and delete operations
remain owner-only. A grantee attempting any mutation receives the same generic
`404 Not Found` response as for a nonexistent resource. Uncategorized
bookmarks are always owner-only.

## Collection shares

Creating, listing, and revoking another person's share are owner-only. The one
grantee-managed operation is deleting the authenticated person's own share
through the singular leave route.

### Create or repeat a grant

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

### List current grants

`GET /collections/:id/shares`

The owner receives `200 OK` and a list of that collection's current grants in
the response shape above. This list is the only recipient-browsing surface and
contains exact granted emails but no names or unrelated accounts. A grantee,
outsider, or unavailable collection receives the generic `404 Not Found`.

### Revoke a grant

`DELETE /collections/:id/shares/:shareId`

The owner receives `204 No Content`. Revocation removes read access
immediately; subsequent shared list, direct, filtered, and nested reads return
the same results as if the grant had never existed. An unavailable collection
or grant returns the generic `404 Not Found`.

### Leave a shared collection

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

## Privacy enforcement

Owner-or-grantee read authorization is applied in the database query shared by
direct, filtered, relation, and nested reads. Owner-only authorization is
applied in every write and share-management query except the grantee's
idempotent self-removal query. IDs, counts, filters, relations, nested routes,
and error differences must not expose unshared resources. The exact JSON error
envelope will be defined with the global error contract; every `404` in this
document uses that one generic shape.

## Sharing acceptance scenarios

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
