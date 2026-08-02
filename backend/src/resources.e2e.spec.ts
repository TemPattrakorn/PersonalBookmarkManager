import {
  expectNotFound,
  expectValidationFailure,
} from "./auth.test-assertions";
import {
  closeResourceHarness,
  requestAs,
  startResourceHarness,
  type Actor,
  type ResourceHarness,
} from "./resource.test-harness";
import { createAuthTestKeys, signTestToken, type AuthTestKeys } from "./auth.test-tokens";

describe("collection and bookmark HTTP contract", () => {
  let keys: AuthTestKeys;
  let harness: ResourceHarness | undefined;
  let owner: Actor;
  let grantee: Actor;
  let outsider: Actor;

  beforeAll(async () => {
    keys = await createAuthTestKeys();
  });

  beforeEach(async () => {
    harness = await startResourceHarness(keys.publicJwk);
    owner = await actor("auth0|owner", "owner@example.com", true);
    grantee = await actor("auth0|grantee", "grantee@example.com", true);
    outsider = await actor("auth0|outsider", "outsider@example.com", true);
    for (const person of [owner, grantee, outsider]) {
      expect((await requestAs(harness, person, "/me")).status).toBe(200);
    }
  });

  afterEach(async () => {
    if (harness) {
      await closeResourceHarness(harness);
      harness = undefined;
    }
  });

  it("persists owner CRUD, validation, pagination, and collection deletion", async () => {
    const collection = await createCollection(" Engineering ");
    expect(collection).toMatchObject({ name: "Engineering", access: "owner" });
    expect(Object.keys(collection).sort()).toEqual([
      "access",
      "createdAt",
      "id",
      "name",
      "updatedAt",
    ]);

    const bookmarkResponse = await requestAs(harness!, owner, "/bookmarks", {
      method: "POST",
      body: {
        url: " https://example.com/article ",
        title: " Example ",
        notes: "private note",
        collectionId: collection.id,
      },
    });
    expect(bookmarkResponse.status).toBe(201);
    const bookmark = (await bookmarkResponse.json()) as Record<string, unknown>;
    expect(bookmark).toMatchObject({
      url: "https://example.com/article",
      title: "Example",
      notes: "private note",
      collectionId: collection.id,
      access: "owner",
    });
    expect(Object.keys(bookmark).sort()).toEqual([
      "access",
      "collectionId",
      "createdAt",
      "id",
      "notes",
      "title",
      "updatedAt",
      "url",
    ]);

    const patchedBookmark = await requestAs(harness!, owner, `/bookmarks/${bookmark.id}`, {
      method: "PATCH",
      body: { notes: null, title: " Renamed bookmark " },
    });
    expect(patchedBookmark.status).toBe(200);
    await expect(patchedBookmark.json()).resolves.toMatchObject({
      notes: null,
      title: "Renamed bookmark",
    });

    const renamed = await requestAs(harness!, owner, `/collections/${collection.id}`, {
      method: "PATCH",
      body: { name: " Updated " },
    });
    expect(renamed.status).toBe(200);
    await expect(renamed.json()).resolves.toMatchObject({ name: "Updated" });

    const ownerPerson = await harness!.prisma.person.findUniqueOrThrow({
      where: { auth0Subject: owner.subject },
    });
    await harness!.prisma.collection.create({
      data: {
        name: "Newest",
        ownerId: ownerPerson.id,
        createdAt: new Date("2030-01-01T00:00:00.000Z"),
        updatedAt: new Date("2030-01-01T00:00:00.000Z"),
      },
    });
    const page = await requestAs(harness!, owner, "/collections?limit=1&offset=0");
    expect(page.status).toBe(200);
    await expect(page.json()).resolves.toEqual([
      expect.objectContaining({ name: "Newest" }),
    ]);

    for (const response of [
      await requestAs(harness!, owner, "/collections?limit=0"),
      await requestAs(harness!, owner, "/collections?unexpected=value"),
      await requestAs(harness!, owner, "/collections?limit=1&limit=2"),
      await requestAs(harness!, owner, "/collections/not-a-uuid"),
      await requestAs(harness!, owner, "/collections", {
        method: "POST",
        body: { ownerId: "leak", name: "No" },
      }),
      await requestAs(harness!, owner, "/bookmarks", {
        method: "POST",
        body: { title: "No", url: "ftp://example.com" },
      }),
    ]) {
      await expectValidationFailure(response);
    }
    const mediaType = await requestAs(harness!, owner, "/collections", {
      method: "POST",
      contentType: "text/plain",
      body: { name: "No" },
    });
    expect(mediaType.status).toBe(415);
    await expect(mediaType.json()).resolves.toEqual({
      statusCode: 415,
      message: "Unsupported media type",
    });

    const deleted = await requestAs(harness!, owner, `/collections/${collection.id}`, {
      method: "DELETE",
    });
    expect(deleted.status).toBe(204);
    expect(await deleted.text()).toBe("");

    const preserved = await requestAs(harness!, owner, `/bookmarks/${bookmark.id}`);
    expect(preserved.status).toBe(200);
    await expect(preserved.json()).resolves.toMatchObject({ collectionId: null });
  });

  it("enforces owner-only writes and non-disclosing shared reads", async () => {
    const collection = await createCollection("Private");
    const bookmark = await createBookmark(collection.id);
    const grant = await requestAs(harness!, owner, `/collections/${collection.id}/shares`, {
      method: "POST",
      body: { email: grantee.email },
    });
    expect(grant.status).toBe(201);

    for (const path of [
      `/collections/${collection.id}`,
      `/collections/${collection.id}/bookmarks`,
      `/bookmarks/${bookmark.id}`,
      `/bookmarks?collectionId=${collection.id}`,
    ]) {
      const response = await requestAs(harness!, grantee, path);
      expect(response.status).toBe(200);
      const body = await response.json();
      const resource = Array.isArray(body) ? body[0] : body;
      expect(resource).toMatchObject({ access: "viewer" });
    }
    const sharedCollections = await requestAs(harness!, grantee, "/collections?scope=shared");
    expect(sharedCollections.status).toBe(200);
    await expect(sharedCollections.json()).resolves.toEqual([
      expect.objectContaining({ id: collection.id, access: "viewer" }),
    ]);
    const unfiltered = await requestAs(harness!, grantee, "/bookmarks");
    await expect(unfiltered.json()).resolves.toEqual([]);

    for (const response of [
      await requestAs(harness!, grantee, `/collections/${collection.id}`, {
        method: "PATCH",
        body: { name: "No" },
      }),
      await requestAs(harness!, grantee, `/bookmarks/${bookmark.id}`, {
        method: "DELETE",
      }),
      await requestAs(harness!, grantee, `/collections/${collection.id}/shares`, {
        method: "POST",
        body: { email: outsider.email },
      }),
      await requestAs(harness!, grantee, `/collections/${collection.id}/shares`),
      await requestAs(harness!, grantee, "/collections/123e4567-e89b-12d3-a456-426614174000/shares/123e4567-e89b-12d3-a456-426614174001", {
        method: "DELETE",
      }),
      await requestAs(harness!, outsider, `/collections/${collection.id}`),
      await requestAs(harness!, outsider, `/bookmarks?collectionId=${collection.id}`),
      await requestAs(harness!, outsider, `/collections/${collection.id}/bookmarks`),
      await requestAs(harness!, outsider, `/bookmarks/${bookmark.id}`),
    ]) {
      await expectNotFound(response);
    }
    await expect((await requestAs(harness!, outsider, "/collections")).json()).resolves.toEqual([]);
    await expect(
      (await requestAs(harness!, outsider, "/collections?scope=shared")).json(),
    ).resolves.toEqual([]);

    const otherCollection = await createCollection("Another");
    const foreignAssignment = await requestAs(harness!, outsider, "/bookmarks", {
      method: "POST",
      body: { title: "No", url: "https://example.com", collectionId: otherCollection.id },
    });
    await expectNotFound(foreignAssignment);
  });

  async function actor(subject: string, email: string, emailVerified: boolean): Promise<Actor> {
    return {
      subject,
      email,
      emailVerified,
      token: await signTestToken(keys.privateKey, harness!.issuer, { subject }),
    };
  }

  async function createCollection(name: string): Promise<{ id: string }> {
    const response = await requestAs(harness!, owner, "/collections", {
      method: "POST",
      body: { name },
    });
    expect(response.status).toBe(201);
    return response.json() as Promise<{ id: string }>;
  }

  async function createBookmark(collectionId: string): Promise<{ id: string }> {
    const response = await requestAs(harness!, owner, "/bookmarks", {
      method: "POST",
      body: { title: "Bookmark", url: "https://example.com", collectionId },
    });
    expect(response.status).toBe(201);
    return response.json() as Promise<{ id: string }>;
  }
});
