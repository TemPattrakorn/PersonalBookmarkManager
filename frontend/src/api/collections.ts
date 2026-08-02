import { apiRequest } from "./client";
import type {
  Collection,
  CollectionInput,
  CollectionScope,
  CollectionShare,
} from "../features/collections/types";

export function listCollections(offset: number, limit = 50, scope: CollectionScope = "owned") {
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (scope === "shared") query.set("scope", scope);
  return apiRequest<Collection[]>(`/collections?${query.toString()}`);
}

export function getCollection(id: string) {
  return apiRequest<Collection>(`/collections/${id}`);
}

export function createCollection(input: CollectionInput) {
  return apiRequest<Collection>("/collections", { body: JSON.stringify(input), method: "POST" });
}

export function updateCollection(id: string, input: CollectionInput) {
  return apiRequest<Collection>(`/collections/${id}`, {
    body: JSON.stringify(input),
    method: "PATCH",
  });
}

export function deleteCollection(id: string) {
  return apiRequest<void>(`/collections/${id}`, { method: "DELETE" });
}

export function listCollectionShares(collectionId: string, offset: number, limit = 50) {
  return apiRequest<CollectionShare[]>(
    `/collections/${collectionId}/shares?limit=${limit}&offset=${offset}`,
  );
}

export function createCollectionShare(collectionId: string, email: string) {
  return apiRequest<CollectionShare>(`/collections/${collectionId}/shares`, {
    body: JSON.stringify({ email }),
    method: "POST",
  });
}

export function revokeCollectionShare(collectionId: string, shareId: string) {
  return apiRequest<void>(`/collections/${collectionId}/shares/${shareId}`, { method: "DELETE" });
}

export function leaveCollection(collectionId: string) {
  return apiRequest<void>(`/collections/${collectionId}/share`, { method: "DELETE" });
}
