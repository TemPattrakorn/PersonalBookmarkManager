import {
  expectAuthenticationRequired,
} from "../../src/auth.test-assertions";
import {
  closeAuthHarness,
  request,
  startAuthHarness,
  type AuthHarness,
} from "../../src/auth.test-harness";
import {
  createAuthTestKeys,
  signTestToken,
  signUntrustedToken,
  signWrongAlgorithmToken,
  type AuthTestKeys,
} from "../../src/auth.test-tokens";

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

  it("reuses a successful synchronization for the same unexpired token", async () => {
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
    await expect(second.json()).resolves.toEqual({ email: "Owner@Example.com" });
    expect(harness.state.userinfoCalls).toBe(1);
    expect(harness.state.userinfoAuthorization).toBe(`Bearer ${token}`);
    expect(harness.upsert).toHaveBeenCalledTimes(1);
    expect(harness.upsert).toHaveBeenCalledWith({
      where: { auth0Subject: "auth0|owner" },
      update: {
        email: "Owner@Example.com",
        normalizedEmail: "owner@example.com",
        emailVerified: true,
      },
      create: {
        auth0Subject: "auth0|owner",
        email: "Owner@Example.com",
        normalizedEmail: "owner@example.com",
        emailVerified: true,
      },
    });

    const refreshedToken = await signTestToken(keys.privateKey, harness.issuer, {
      expirationTime: "10m",
    });
    const refreshed = await request(harness.baseUrl, "/me", `Bearer ${refreshedToken}`);
    expect(refreshed.status).toBe(200);
    await expect(refreshed.json()).resolves.toEqual({ email: "updated@example.com" });
    expect(harness.state.userinfoCalls).toBe(2);
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

  it("coalesces concurrent requests and keeps their successful result", async () => {
    harness = await startAuthHarness(keys.publicJwk);
    harness.state.userinfo.delayMs = 30;
    const token = await signTestToken(keys.privateKey, harness.issuer);

    const responses = await Promise.all(
      Array.from({ length: 4 }, () => request(harness!.baseUrl, "/me", `Bearer ${token}`)),
    );

    expect(responses.map(({ status }) => status)).toEqual([200, 200, 200, 200]);
    expect(harness.state.userinfoCalls).toBe(1);
    expect(harness.upsert).toHaveBeenCalledTimes(1);

    harness.state.userinfo = {
      body: {
        sub: "auth0|owner",
        email: "updated@example.com",
        email_verified: false,
      },
    };
    const next = await request(harness.baseUrl, "/me", `Bearer ${token}`);

    expect(next.status).toBe(200);
    await expect(next.json()).resolves.toEqual({ email: "Owner@Example.com" });
    expect(harness.state.userinfoCalls).toBe(1);
    expect(harness.upsert).toHaveBeenCalledTimes(1);
  });

  it("never serves a cached person after the verified token expires", async () => {
    harness = await startAuthHarness(keys.publicJwk);
    const expiresAt = Math.floor(Date.now() / 1_000) + 60;
    const token = await signTestToken(keys.privateKey, harness.issuer, {
      expirationTime: expiresAt,
    });

    const first = await request(harness.baseUrl, "/me", `Bearer ${token}`);
    expect(first.status).toBe(200);

    const now = jest.spyOn(Date, "now").mockReturnValue((expiresAt + 1) * 1_000);
    try {
      await expectAuthenticationRequired(
        await request(harness.baseUrl, "/me", `Bearer ${token}`),
      );
    } finally {
      now.mockRestore();
    }

    expect(harness.state.userinfoCalls).toBe(1);
    expect(harness.upsert).toHaveBeenCalledTimes(1);
  });

  it("never shares authentication work between different tokens", async () => {
    harness = await startAuthHarness(keys.publicJwk);
    harness.state.userinfo.delayMs = 30;
    const firstToken = await signTestToken(keys.privateKey, harness.issuer);
    const secondToken = await signTestToken(keys.privateKey, harness.issuer, {
      expirationTime: "10m",
    });

    const responses = await Promise.all([
      request(harness.baseUrl, "/me", `Bearer ${firstToken}`),
      request(harness.baseUrl, "/me", `Bearer ${secondToken}`),
    ]);

    expect(firstToken).not.toBe(secondToken);
    expect(responses.map(({ status }) => status)).toEqual([200, 200]);
    expect(harness.state.userinfoCalls).toBe(2);
    expect(harness.upsert).toHaveBeenCalledTimes(2);
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
