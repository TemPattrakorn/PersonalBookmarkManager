import {
  expectNotFound,
  expectValidationFailure,
} from "../../src/auth.test-assertions";
import {
  closeResourceHarness,
  requestAs,
  startResourceHarness,
  type Actor,
  type ResourceHarness,
} from "../../src/resource.test-harness";
import { createAuthTestKeys, signTestToken, type AuthTestKeys } from "../../src/auth.test-tokens";

describe("collection sharing HTTP contract", () => {
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
    grantee = await actor("auth0|grantee", "Grantee@Example.com", true);
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

  it("creates, repeats, lists, and revokes owner-managed grants", async () => {
    const collection = await createCollection();
    const first = await grant(collection.id, " grantee@example.com ");
    expect(first.status).toBe(201);
    const created = (await first.json()) as { createdAt: string; email: string; id: string };
    expect(created.email).toBe("Grantee@Example.com");

    const repeated = await grant(collection.id, grantee.email);
    expect(repeated.status).toBe(200);
    await expect(repeated.json()).resolves.toMatchObject({ id: created.id });

    const listed = await requestAs(harness!, owner, `/collections/${collection.id}/shares`);
    expect(listed.status).toBe(200);
    await expect(listed.json()).resolves.toEqual([
      { id: created.id, email: "Grantee@Example.com", createdAt: created.createdAt },
    ]);

    for (const email of ["a", "bad@@example.com", "bad @example.com", owner.email]) {
      await expectValidationFailure(await grant(collection.id, email));
    }

    const unverified = await signIn("auth0|unverified", "unverified@example.com", false);
    const duplicateOne = await signIn("auth0|duplicate-one", "duplicate@example.com", true);
    await signIn("auth0|duplicate-two", "DUPLICATE@example.com", true);
    for (const email of ["unknown@example.com", unverified.email, duplicateOne.email]) {
      await expectNotFound(await grant(collection.id, email));
    }

    for (const response of [
      await requestAs(harness!, grantee, `/collections/${collection.id}/shares`),
      await requestAs(harness!, outsider, `/collections/${collection.id}/shares/${created.id}`, {
        method: "DELETE",
      }),
    ]) {
      await expectNotFound(response);
    }

    const revoked = await requestAs(harness!, owner, `/collections/${collection.id}/shares/${created.id}`, {
      method: "DELETE",
    });
    expect(revoked.status).toBe(204);
    await expectNotFound(await requestAs(harness!, grantee, `/collections/${collection.id}`));
    await expectNotFound(
      await requestAs(harness!, owner, `/collections/${collection.id}/shares/${created.id}`, {
        method: "DELETE",
      }),
    );
  });

  it("lets only the grantee leave without exposing or changing other data", async () => {
    const collection = await createCollection();
    const bookmark = await createBookmark(collection.id);
    await grant(collection.id, grantee.email);
    const otherGrantee = await signIn("auth0|other-grantee", "other@example.com", true);
    await grant(collection.id, otherGrantee.email);

    const leave = await requestAs(harness!, grantee, `/collections/${collection.id}/share`, {
      method: "DELETE",
    });
    expect(leave.status).toBe(204);
    await expectNotFound(await requestAs(harness!, grantee, `/collections/${collection.id}`));
    expect((await requestAs(harness!, otherGrantee, `/collections/${collection.id}`)).status).toBe(200);
    expect((await requestAs(harness!, owner, `/bookmarks/${bookmark.id}`)).status).toBe(200);

    for (const actor of [grantee, owner, outsider]) {
      const response = await requestAs(harness!, actor, "/collections/123e4567-e89b-12d3-a456-426614174000/share", {
        method: "DELETE",
      });
      expect(response.status).toBe(204);
    }
    expect(
      (await requestAs(harness!, grantee, `/collections/${collection.id}/share`, { method: "DELETE" })).status,
    ).toBe(204);

    const regrant = await grant(collection.id, grantee.email);
    expect(regrant.status).toBe(201);
    grantee.email = "renamed@example.com";
    expect((await requestAs(harness!, grantee, "/me")).status).toBe(200);
    expect((await requestAs(harness!, grantee, `/collections/${collection.id}`)).status).toBe(200);

    const deleted = await requestAs(harness!, owner, `/collections/${collection.id}`, {
      method: "DELETE",
    });
    expect(deleted.status).toBe(204);
    await expectNotFound(await requestAs(harness!, otherGrantee, `/collections/${collection.id}`));
    const preserved = await requestAs(harness!, owner, `/bookmarks/${bookmark.id}`);
    await expect(preserved.json()).resolves.toMatchObject({ collectionId: null, access: "owner" });
  });

  async function actor(subject: string, email: string, emailVerified: boolean): Promise<Actor> {
    return {
      subject,
      email,
      emailVerified,
      token: await signTestToken(keys.privateKey, harness!.issuer, { subject }),
    };
  }

  async function signIn(
    subject: string,
    email: string,
    emailVerified: boolean,
  ): Promise<Actor> {
    const person = await actor(subject, email, emailVerified);
    expect((await requestAs(harness!, person, "/me")).status).toBe(200);
    return person;
  }

  async function createCollection(): Promise<{ id: string }> {
    const response = await requestAs(harness!, owner, "/collections", {
      method: "POST",
      body: { name: "Shared" },
    });
    expect(response.status).toBe(201);
    return response.json() as Promise<{ id: string }>;
  }

  async function createBookmark(collectionId: string): Promise<{ id: string }> {
    const response = await requestAs(harness!, owner, "/bookmarks", {
      method: "POST",
      body: { title: "Shared bookmark", url: "https://example.com", collectionId },
    });
    expect(response.status).toBe(201);
    return response.json() as Promise<{ id: string }>;
  }

  function grant(collectionId: string, email: string): Promise<Response> {
    return requestAs(harness!, owner, `/collections/${collectionId}/shares`, {
      method: "POST",
      body: { email },
    });
  }
});
