import {
  expectAuthenticationRequired,
} from "./auth.test-assertions";
import {
  closeAuthHarness,
  request,
  startAuthHarness,
  type AuthHarness,
} from "./auth.test-harness";
import {
  createAuthTestKeys,
  signTestToken,
  signUntrustedToken,
  signWrongAlgorithmToken,
  type AuthTestKeys,
} from "./auth.test-tokens";

describe("authenticated identity HTTP contract", () => {
  let keys: AuthTestKeys;
  let harness: AuthHarness | undefined;

  beforeAll(async () => {
    keys = await createAuthTestKeys();
  });

  afterEach(async () => {
    if (harness) {
      await closeAuthHarness(harness);
      harness = undefined;
    }
  });

  it("returns /me and synchronizes verified and unverified profiles on every request", async () => {
    harness = await startAuthHarness(keys.publicJwk);
    const token = await signTestToken(keys.privateKey, harness.issuer);

    const first = await request(harness.baseUrl, "/me", `Bearer ${token}`);
    expect(first.status).toBe(200);
    await expect(first.json()).resolves.toEqual({ email: "Owner@Example.com" });

    harness.state.userinfo.body = {
      sub: "auth0|owner",
      email: " updated@example.com ",
      email_verified: false,
    };
    const second = await request(harness.baseUrl, "/me", `Bearer ${token}`);
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toEqual({ email: "updated@example.com" });
    expect(harness.state.userinfoCalls).toBe(2);
    expect(harness.state.userinfoAuthorization).toBe(`Bearer ${token}`);
    expect(harness.upsert).toHaveBeenLastCalledWith({
      where: { auth0Subject: "auth0|owner" },
      update: {
        email: "updated@example.com",
        normalizedEmail: "updated@example.com",
        emailVerified: false,
      },
      create: {
        auth0Subject: "auth0|owner",
        email: "updated@example.com",
        normalizedEmail: "updated@example.com",
        emailVerified: false,
      },
    });
  });

  it("keeps different subjects separate even when their normalized emails match", async () => {
    harness = await startAuthHarness(keys.publicJwk);
    const ownerToken = await signTestToken(keys.privateKey, harness.issuer);
    await request(harness.baseUrl, "/me", `Bearer ${ownerToken}`);

    harness.state.userinfo.body = {
      sub: "auth0|other",
      email: "owner@example.com",
      email_verified: true,
    };
    const otherToken = await signTestToken(keys.privateKey, harness.issuer, {
      subject: "auth0|other",
    });
    const response = await request(harness.baseUrl, "/me", `Bearer ${otherToken}`);

    expect(response.status).toBe(200);
    expect(harness.people.size).toBe(2);
    expect([...harness.people.keys()]).toEqual(["auth0|owner", "auth0|other"]);
  });

  it("normalizes common credential failures to the same 401 response", async () => {
    harness = await startAuthHarness(keys.publicJwk);
    const expired = await signTestToken(keys.privateKey, harness.issuer, {
      expirationTime: Math.floor(Date.now() / 1000) - 60,
    });
    const wrongIssuer = await signTestToken(
      keys.privateKey,
      "https://wrong.example.com/",
    );
    const wrongAudience = await signTestToken(keys.privateKey, harness.issuer, {
      audience: "https://wrong.example.com/api",
    });
    const wrongAlgorithm = await signWrongAlgorithmToken(
      keys.symmetricKey,
      harness.issuer,
    );

    for (const authorization of [
      undefined,
      "Basic credentials",
      "Bearer malformed",
      `Bearer ${expired}`,
      `Bearer ${wrongIssuer}`,
      `Bearer ${wrongAudience}`,
      `Bearer ${wrongAlgorithm}`,
    ]) {
      await expectAuthenticationRequired(
        await request(harness.baseUrl, "/me", authorization),
      );
    }

    expect(harness.upsert).not.toHaveBeenCalled();
  });

  it("rejects a locally malformed token even when discovery is unavailable", async () => {
    harness = await startAuthHarness(keys.publicJwk);
    harness.state.discovery.status = 500;
    await expectAuthenticationRequired(
      await request(harness.baseUrl, "/me", "Bearer malformed"),
    );
  });

  it("rejects a valid-looking token signed by an untrusted key before profile lookup", async () => {
    harness = await startAuthHarness(keys.publicJwk);
    const token = await signUntrustedToken(harness.issuer);

    await expectAuthenticationRequired(
      await request(harness.baseUrl, "/me", `Bearer ${token}`),
    );
    expect(harness.state.userinfoCalls).toBe(0);
    expect(harness.upsert).not.toHaveBeenCalled();
  });

  it("rejects mismatched or missing /userinfo identity without writing", async () => {
    harness = await startAuthHarness(keys.publicJwk);
    const token = await signTestToken(keys.privateKey, harness.issuer);

    for (const body of [
      { sub: "auth0|other", email: "owner@example.com", email_verified: true },
      { sub: "auth0|owner", email_verified: true },
      { sub: "auth0|owner", email: "   ", email_verified: true },
    ]) {
      harness.state.userinfo.body = body;
      await expectAuthenticationRequired(
        await request(harness.baseUrl, "/me", `Bearer ${token}`),
      );
    }

    expect(harness.upsert).not.toHaveBeenCalled();
  });
});
