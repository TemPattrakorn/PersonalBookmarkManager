import { getAuthClient } from "../auth";

export const API_ORIGIN = "http://localhost:3001";

export class ApiError extends Error {
  constructor(readonly status: number) {
    super("Request failed");
  }
}

export function failureStatus(error: unknown): number {
  return error instanceof ApiError ? error.status : 500;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = new URL(path, API_ORIGIN);
  if (!path.startsWith("/") || url.origin !== API_ORIGIN) {
    throw new ApiError(500);
  }

  let token: string;
  try {
    token = await (await getAuthClient()).getTokenSilently();
  } catch {
    throw new ApiError(401);
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, credentials: "omit", headers });
  } catch {
    throw new ApiError(503);
  }

  if (!response.ok) throw new ApiError(response.status);
  if (response.status === 204) return undefined as T;

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(503);
  }
}
