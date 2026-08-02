import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAuthClient } = vi.hoisted(() => ({ getAuthClient: vi.fn() }));

vi.mock("./auth", () => ({ getAuthClient }));

describe("authenticated API requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the bearer token only to the local API and omits browser credentials", async () => {
    const getTokenSilently = vi.fn().mockResolvedValue("access-token");
    getAuthClient.mockResolvedValue({ getTokenSilently });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: "collection" }]), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { apiRequest } = await import("./api");

    await expect(apiRequest<{ id: string }[]>("/collections")).resolves.toEqual([
      { id: "collection" },
    ]);

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.origin).toBe("http://localhost:3001");
    expect(url.pathname).toBe("/collections");
    expect(init.credentials).toBe("omit");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer access-token");
  });

  it("maps a rejected credential to reauthentication without exposing a response body", async () => {
    getAuthClient.mockResolvedValue({ getTokenSilently: vi.fn().mockResolvedValue("token") });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private details", { status: 401 })));
    const { ApiError, apiRequest } = await import("./api");

    await expect(apiRequest("/collections")).rejects.toEqual(new ApiError(401));
  });

  it("refuses a protocol-relative path before obtaining a token", async () => {
    const { ApiError, apiRequest } = await import("./api");

    await expect(apiRequest("//example.com/private")).rejects.toEqual(new ApiError(500));
    expect(getAuthClient).not.toHaveBeenCalled();
  });
});
