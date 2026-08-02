import { useCallback, useEffect, useRef, useState } from "react";
import { failureStatus } from "../api/client";
import { useAuth } from "../auth-context";

export const PAGE_SIZE = 50;

export function listFailureStatus(error: unknown, requireLogin: () => void): number {
  const status = failureStatus(error);
  if (status === 401) requireLogin();
  return status;
}

export function usePagedList<T>(loadPage: (offset: number) => Promise<T[]>, enabled = true) {
  const { requireLogin } = useAuth();
  const source = useRef(loadPage);
  const sourceChanged = source.current !== loadPage;
  const [items, setItems] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryable, setRetryable] = useState(false);
  const [status, setStatus] = useState<number>();
  const [reloadToken, setReloadToken] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let active = true;
    const changed = source.current !== loadPage;
    source.current = loadPage;
    if (!enabled) {
      setHasMore(false);
      setItems([]);
      setLoaded(false);
      setLoading(false);
      setRetryable(false);
      setStatus(undefined);
      return () => {
        active = false;
      };
    }
    if (changed) {
      setHasMore(false);
      setItems([]);
      setLoaded(false);
    }
    setLoading(true);
    setRetryable(false);
    setStatus(undefined);
    void loadPage(0)
      .then((page) => {
        if (active) {
          setItems(page);
          setHasMore(page.length === PAGE_SIZE);
          setLoaded(true);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setRetryable(true);
          setStatus(listFailureStatus(error, requireLogin));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [enabled, loadPage, reloadToken, requireLogin]);

  const reload = useCallback(() => setReloadToken((value) => value + 1), []);
  const setRequestStatus = useCallback((next: number | undefined) => {
    setRetryable(false);
    setStatus(next);
  }, []);
  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    setRetryable(false);
    setStatus(undefined);
    try {
      const page = await loadPage(items.length);
      setItems((current) => [...current, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch (error) {
      setRetryable(true);
      setStatus(listFailureStatus(error, requireLogin));
    } finally {
      setLoadingMore(false);
    }
  }, [items.length, loadPage, requireLogin]);

  const current = enabled && !sourceChanged;
  return {
    hasMore: current && hasMore,
    items: current ? items : [],
    loaded: current && loaded,
    loadMore,
    loading: enabled && (loading || sourceChanged),
    loadingMore,
    reload,
    retryable: current && retryable,
    status: current ? status : undefined,
    setStatus: setRequestStatus,
  };
}
