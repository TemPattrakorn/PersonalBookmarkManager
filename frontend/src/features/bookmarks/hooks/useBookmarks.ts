import { useCallback, useEffect, useState } from "react";
import {
  createBookmark,
  deleteBookmark,
  listBookmarks,
  updateBookmark,
} from "../../../api/bookmarks";
import { listCollections } from "../../../api/collections";
import { failureStatus } from "../../../api/client";
import { useAuth } from "../../../auth-context";
import { PAGE_SIZE, usePagedList } from "../../../hooks/usePagedList";
import type { Collection } from "../../collections/types";
import type { Bookmark, BookmarkInput } from "../types";

export function useBookmarks(collectionFilter?: string) {
  const { requireLogin } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsStatus, setCollectionsStatus] = useState<number>();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    void listCollections(0, 100)
      .then((page) => {
        if (active) setCollections(page);
      })
      .catch((error: unknown) => {
        if (active) {
          const status = failureStatus(error);
          setCollectionsStatus(status);
          if (status === 401) requireLogin();
        }
      });
    return () => {
      active = false;
    };
  }, [requireLogin]);

  const loadPage = useCallback(
    (offset: number) => listBookmarks(offset, collectionFilter, PAGE_SIZE),
    [collectionFilter],
  );
  const paged = usePagedList(loadPage);

  const save = useCallback(
    async (editing: Bookmark | undefined, input: BookmarkInput) => {
      setSaving(true);
      paged.setStatus(undefined);
      try {
        if (editing) await updateBookmark(editing.id, input);
        else await createBookmark(input);
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
    async (bookmark: Bookmark) => {
      setDeleting(true);
      paged.setStatus(undefined);
      try {
        await deleteBookmark(bookmark.id);
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

  return { ...paged, collections, collectionsStatus, deleting, remove, save, saving };
}
