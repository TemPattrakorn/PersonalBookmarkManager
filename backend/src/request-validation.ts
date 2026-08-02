import {
  BadRequestException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import type { Request } from "express";

export type Pagination = { limit: number; offset: number };

type CollectionInput = { name: string };
export type BookmarkCreateInput = {
  collectionId: string | null;
  notes: string | null;
  title: string;
  url: string;
};
export type BookmarkPatchInput = Partial<BookmarkCreateInput>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseUuid(value: unknown): string {
  if (typeof value !== "string" || !UUID.test(value)) invalid();
  return value;
}

export function parsePagination(
  query: Record<string, unknown>,
  allowed: readonly string[],
): Pagination {
  assertKnownKeys(query, allowed);
  return {
    limit: parseInteger(query.limit, 50, 1, 100),
    offset: parseInteger(query.offset, 0, 0, Number.MAX_SAFE_INTEGER),
  };
}

export function parseCollectionListQuery(query: Record<string, unknown>): {
  pagination: Pagination;
  scope: "owned" | "shared";
} {
  assertKnownKeys(query, ["scope", "limit", "offset"]);
  const scope = query.scope;
  if (scope !== undefined && scope !== "owned" && scope !== "shared") invalid();
  return {
    pagination: {
      limit: parseInteger(query.limit, 50, 1, 100),
      offset: parseInteger(query.offset, 0, 0, Number.MAX_SAFE_INTEGER),
    },
    scope: scope ?? "owned",
  };
}

export function parseBookmarkListQuery(query: Record<string, unknown>): {
  collectionId?: string;
  pagination: Pagination;
} {
  assertKnownKeys(query, ["collectionId", "limit", "offset"]);
  return {
    collectionId:
      query.collectionId === undefined ? undefined : parseUuid(query.collectionId),
    pagination: {
      limit: parseInteger(query.limit, 50, 1, 100),
      offset: parseInteger(query.offset, 0, 0, Number.MAX_SAFE_INTEGER),
    },
  };
}

export function parseCollectionCreate(request: Request): CollectionInput {
  const body = jsonBody(request, ["name"]);
  if (!("name" in body)) invalid();
  return { name: requiredText(body.name, 100) };
}

export function parseCollectionPatch(request: Request): Partial<CollectionInput> {
  const body = jsonBody(request, ["name"]);
  if (!("name" in body)) invalid();
  return { name: requiredText(body.name, 100) };
}

export function parseBookmarkCreate(request: Request): BookmarkCreateInput {
  const body = jsonBody(request, ["url", "title", "notes", "collectionId"]);
  if (!("url" in body) || !("title" in body)) invalid();
  return {
    url: url(body.url),
    title: requiredText(body.title, 200),
    notes: "notes" in body ? notes(body.notes) : null,
    collectionId: "collectionId" in body ? collectionId(body.collectionId) : null,
  };
}

export function parseBookmarkPatch(request: Request): BookmarkPatchInput {
  const body = jsonBody(request, ["url", "title", "notes", "collectionId"]);
  if (Object.keys(body).length === 0) invalid();
  return {
    ...("url" in body ? { url: url(body.url) } : {}),
    ...("title" in body ? { title: requiredText(body.title, 200) } : {}),
    ...("notes" in body ? { notes: notes(body.notes) } : {}),
    ...("collectionId" in body ? { collectionId: collectionId(body.collectionId) } : {}),
  };
}

export function parseShareCreate(request: Request): { email: string } {
  const body = jsonBody(request, ["email"]);
  if (!("email" in body)) invalid();
  if (typeof body.email !== "string") invalid();
  const email = body.email.trim();
  const parts = email.split("@");
  if (
    email.length < 3 ||
    email.length > 254 ||
    /\s/.test(email) ||
    parts.length !== 2 ||
    parts[0].length === 0 ||
    parts[1].length === 0
  ) {
    invalid();
  }
  return { email };
}

function jsonBody(request: Request, allowed: readonly string[]): Record<string, unknown> {
  if (!request.is("application/json")) {
    throw new UnsupportedMediaTypeException();
  }
  const body = request.body;
  if (typeof body !== "object" || body === null || Array.isArray(body)) invalid();
  assertKnownKeys(body as Record<string, unknown>, allowed);
  return body as Record<string, unknown>;
}

function assertKnownKeys(value: Record<string, unknown>, allowed: readonly string[]): void {
  if (Object.keys(value).some((key) => !allowed.includes(key))) invalid();
}

function parseInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) invalid();
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) invalid();
  return parsed;
}

function requiredText(value: unknown, maximum: number): string {
  if (typeof value !== "string") invalid();
  const text = value.trim();
  if (text.length === 0 || text.length > maximum) invalid();
  return text;
}

function url(value: unknown): string {
  if (typeof value !== "string") invalid();
  const text = value.trim();
  if (text.length === 0 || text.length > 2048) invalid();
  try {
    const parsed = new URL(text);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") invalid();
  } catch {
    invalid();
  }
  return text;
}

function notes(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 5000) {
    invalid();
  }
  return value;
}

function collectionId(value: unknown): string | null {
  return value === null ? null : parseUuid(value);
}

function invalid(): never {
  throw new BadRequestException();
}
