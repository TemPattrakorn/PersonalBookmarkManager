import { useCallback, useEffect, useState } from "react";
import { failureStatus } from "../api/client";
import { useAuth } from "../auth-context";

export const PAGE_SIZE = 50;

export function usePagedList<T>(loadPage: (offset: number) => Promise<T[]>) {
  const { requireLogin } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [status, setStatus] = useState<number>();
  const [reloadToken, setReloadToken] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setStatus(undefined);
    void loadPage(0)
      .then((page) => {
        if (active) {
          setItems(page);
          setHasMore(page.length === PAGE_SIZE);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          const nextStatus = failureStatus(error);
          setStatus(nextStatus);
          if (nextStatus === 401) requireLogin();
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadPage, reloadToken, requireLogin]);

  const reload = useCallback(() => setReloadToken((value) => value + 1), []);
  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    setStatus(undefined);
    try {
      const page = await loadPage(items.length);
      setItems((current) => [...current, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch (error) {
      const nextStatus = failureStatus(error);
      setStatus(nextStatus);
      if (nextStatus === 401) requireLogin();
    } finally {
      setLoadingMore(false);
    }
  }, [items.length, loadPage, requireLogin]);

  return { hasMore, items, loadMore, loading, loadingMore, reload, status, setStatus };
}
