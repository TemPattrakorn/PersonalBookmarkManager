import { apiRequest } from "./client";
import type { Bookmark, BookmarkInput } from "../features/bookmarks/types";

export function listBookmarks(offset: number, collectionId?: string, limit = 50) {
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (collectionId) query.set("collectionId", collectionId);
  return apiRequest<Bookmark[]>(`/bookmarks?${query.toString()}`);
}

export function createBookmark(input: BookmarkInput) {
  return apiRequest<Bookmark>("/bookmarks", { body: JSON.stringify(input), method: "POST" });
}

export function updateBookmark(id: string, input: BookmarkInput) {
  return apiRequest<Bookmark>(`/bookmarks/${id}`, { body: JSON.stringify(input), method: "PATCH" });
}

export function deleteBookmark(id: string) {
  return apiRequest<void>(`/bookmarks/${id}`, { method: "DELETE" });
}
