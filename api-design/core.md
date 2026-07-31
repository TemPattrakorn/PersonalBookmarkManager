# Core API

[Back to the API design index](../API_DESIGN.md)

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

All collection and bookmark create, `PATCH`, and delete operations
remain owner-only. A grantee attempting any mutation receives the same generic
`404 Not Found` response as for a nonexistent resource. Uncategorized
bookmarks are always owner-only.

## Update semantics

`PATCH` is the only update verb; there are no `PUT` endpoints. `PATCH
/collections/:id` accepts a partial collection body, and `PATCH /bookmarks/:id`
accepts a partial bookmark body. Omitted editable fields keep their current
values. Every supplied field is validated; an empty body, an unknown or
read-only field, or a malformed value returns `400 Bad Request`.

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

## Privacy enforcement

Owner-or-grantee read authorization is applied in the database query shared by
direct, filtered, relation, and nested reads. Owner-only authorization is
applied in every write and share-management query except the grantee's
idempotent self-removal query. IDs, counts, filters, relations, nested routes,
and error differences must not expose unshared resources. Every `404` in this
document uses the generic shape defined by the [error contract](errors.md).
