# API design

## Delete a collection

`DELETE /collections/:id` requires a verified Auth0 access token. The API
derives the person from that token and scopes the lookup and mutation to that
person's collection; it never accepts an owner ID from the request.

On success, the API atomically deletes the collection and sets `collectionId`
to `null` for bookmarks owned by the authenticated person that belonged to it.
It returns `204 No Content` with no response body. Bookmarks are neither
deleted nor returned, and the response does not include an unlink count.

If no collection with that ID belongs to the authenticated person, including
when the ID belongs to someone else, the API returns the same `404 Not Found`
response. This prevents callers from inferring another person's collection.
