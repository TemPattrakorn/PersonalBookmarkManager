import { apiRequest } from "./client";
import type { Collection, CollectionInput } from "../features/collections/types";

export function listCollections(offset: number, limit = 50) {
  return apiRequest<Collection[]>(`/collections?limit=${limit}&offset=${offset}`);
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
