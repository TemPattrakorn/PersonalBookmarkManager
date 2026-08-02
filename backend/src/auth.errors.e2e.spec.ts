import {
  expectAuthenticationRequired,
  expectServiceUnavailable,
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
  type AuthTestKeys,
} from "./auth.test-tokens";

describe("authentication error HTTP contract", () => {
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

  it("maps /userinfo credential rejection to 401 and provider failures to 503", async () => {
    harness = await startAuthHarness(keys.publicJwk);
    const token = await signTestToken(keys.privateKey, harness.issuer);

    for (const status of [401, 403, 404]) {
      harness.state.userinfo = { status };
      await expectAuthenticationRequired(
        await request(harness.baseUrl, "/me", `Bearer ${token}`),
      );
    }

    for (const reply of [
      { status: 429 },
      { status: 500 },
      { rawBody: "{" },
      {
        body: { sub: 42, email: "owner@example.com", email_verified: true },
      },
    ]) {
      harness.state.userinfo = reply;
      await expectServiceUnavailable(
        await request(harness.baseUrl, "/me", `Bearer ${token}`),
      );
    }
  });

  it.each(["discovery", "jwks", "userinfo"] as const)(
    "maps a %s timeout to 503",
    async (stage) => {
      harness = await startAuthHarness(keys.publicJwk, 30);
      harness.state[stage].delayMs = 100;
      const token = await signTestToken(keys.privateKey, harness.issuer);
      await expectServiceUnavailable(
        await request(harness.baseUrl, "/me", `Bearer ${token}`),
      );
    },
  );

  it.each(["discovery", "jwks"] as const)(
    "maps unavailable %s data to 503",
    async (stage) => {
      harness = await startAuthHarness(keys.publicJwk);
      harness.state[stage] = { status: 500 };
      const token = await signTestToken(keys.privateKey, harness.issuer);
      await expectServiceUnavailable(
        await request(harness.baseUrl, "/me", `Bearer ${token}`),
      );
    },
  );

  it.each(["discovery", "jwks"] as const)(
    "maps malformed %s data to 503",
    async (stage) => {
      harness = await startAuthHarness(keys.publicJwk);
      harness.state[stage] =
        stage === "discovery" ? { rawBody: "{" } : { body: { keys: "invalid" } };
      const token = await signTestToken(keys.privateKey, harness.issuer);
      await expectServiceUnavailable(
        await request(harness.baseUrl, "/me", `Bearer ${token}`),
      );
    },
  );

  it("rejects untrusted discovery endpoints without contacting them", async () => {
    harness = await startAuthHarness(keys.publicJwk);
    harness.state.discovery.body = {
      issuer: harness.issuer,
      jwks_uri: "https://attacker.example.com/jwks",
      userinfo_endpoint: `${harness.issuer}userinfo`,
    };
    const token = await signTestToken(keys.privateKey, harness.issuer);
    await expectServiceUnavailable(
      await request(harness.baseUrl, "/me", `Bearer ${token}`),
    );
  });

  it("returns a sanitized 500 when persistence fails", async () => {
    harness = await startAuthHarness(keys.publicJwk);
    harness.upsert.mockRejectedValueOnce(
      new Error("database secret and access token must not leak"),
    );
    const token = await signTestToken(keys.privateKey, harness.issuer);
    const response = await request(harness.baseUrl, "/me", `Bearer ${token}`);

    expect(response.status).toBe(500);
    const body = await response.text();
    expect(JSON.parse(body)).toEqual({
      statusCode: 500,
      message: "Internal server error",
    });
    expect(body).not.toContain("secret");
    expect(body).not.toContain(token);
  });

  it("returns a sanitized 400 for malformed JSON before authentication", async () => {
    harness = await startAuthHarness(keys.publicJwk);
    const response = await fetch(`${harness.baseUrl}/me`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      statusCode: 400,
      message: "Validation failed",
    });
    expect(harness.state.userinfoCalls).toBe(0);
    expect(harness.upsert).not.toHaveBeenCalled();
  });

  it("normalizes an unknown route to the generic 404", async () => {
    harness = await startAuthHarness(keys.publicJwk);
    const response = await request(harness.baseUrl, "/unknown");
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      statusCode: 404,
      message: "Resource not found",
    });
  });
});
