import { useCallback, useState } from "react";
import {
  createCollection,
  deleteCollection,
  leaveCollection,
  listCollections,
  updateCollection,
} from "../../../api/collections";
import { failureStatus } from "../../../api/client";
import { useAuth } from "../../../auth-context";
import { PAGE_SIZE, usePagedList } from "../../../hooks/usePagedList";
import type { Collection, CollectionInput, CollectionScope } from "../types";

export function useCollections(scope: CollectionScope = "owned") {
  const { requireLogin } = useAuth();
  const loadPage = useCallback(
    (offset: number) => listCollections(offset, PAGE_SIZE, scope),
    [scope],
  );
  const paged = usePagedList(loadPage);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = useCallback(
    async (editing: Collection | undefined, input: CollectionInput) => {
      setSaving(true);
      paged.setStatus(undefined);
      try {
        if (editing) await updateCollection(editing.id, input);
        else await createCollection(input);
        paged.reload();
        return true;
      } catch (error) {
        const status = failureStatus(error);
        paged.setStatus(status);
        if (status === 401) requireLogin();
        return false;
      } finally {
        setSaving(false);
      }
    },
    [paged, requireLogin],
  );

  const remove = useCallback(
    async (collection: Collection) => {
      setDeleting(true);
      paged.setStatus(undefined);
      try {
        await deleteCollection(collection.id);
        paged.reload();
        return true;
      } catch (error) {
        const status = failureStatus(error);
        paged.setStatus(status);
        if (status === 401) requireLogin();
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [paged, requireLogin],
  );

  const leave = useCallback(
    async (collection: Collection) => {
      setDeleting(true);
      paged.setStatus(undefined);
      try {
        await leaveCollection(collection.id);
        paged.reload();
        return true;
      } catch (error) {
        const status = failureStatus(error);
        paged.setStatus(status);
        if (status === 401) requireLogin();
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [paged, requireLogin],
  );

  return { ...paged, leave, remove, save, saving, deleting };
}
