import { describe, expect, it, vi } from "vitest";

const { createAuth0Client } = vi.hoisted(() => ({ createAuth0Client: vi.fn() }));

vi.mock("@auth0/auth0-spa-js", () => ({ createAuth0Client }));

describe("Auth0 client configuration", () => {
  it("uses the approved public SPA settings and Auth0 redirect operations", async () => {
    const fakeClient = {
      handleRedirectCallback: vi.fn(),
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
    };
    createAuth0Client.mockResolvedValue(fakeClient);
    const { completeLogin, getAuthClient, signOut, startLogin } = await import("./auth");

    await expect(getAuthClient()).resolves.toBe(fakeClient);
    await expect(getAuthClient()).resolves.toBe(fakeClient);
    await startLogin();
    await completeLogin();
    await signOut();

    expect(createAuth0Client).toHaveBeenCalledTimes(1);
    expect(createAuth0Client).toHaveBeenCalledWith({
      domain: "dev-yg.us.auth0.com",
      clientId: "H9F6QG5SzTKMv0tbmgxLj9LjG1EKVllA",
      cacheLocation: "memory",
      authorizationParams: {
        audience: "https://bbl-candidate-test-api",
        redirect_uri: "http://localhost:3000/callback",
        scope: "openid profile email",
      },
    });
    expect(fakeClient.loginWithRedirect).toHaveBeenCalledWith({
      authorizationParams: { redirect_uri: "http://localhost:3000/callback" },
    });
    expect(fakeClient.handleRedirectCallback).toHaveBeenCalledOnce();
    expect(fakeClient.logout).toHaveBeenCalledWith({
      logoutParams: { returnTo: "http://localhost:3000" },
    });
  });
});
