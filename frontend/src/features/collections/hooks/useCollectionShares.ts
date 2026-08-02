import { useCallback, useState } from "react";
import {
  createCollectionShare,
  listCollectionShares,
  revokeCollectionShare,
} from "../../../api/collections";
import { failureStatus } from "../../../api/client";
import { useAuth } from "../../../auth-context";
import { PAGE_SIZE, usePagedList } from "../../../hooks/usePagedList";

export function useCollectionShares(collectionId: string) {
  const { requireLogin } = useAuth();
  const loadPage = useCallback(
    (offset: number) => listCollectionShares(collectionId, offset, PAGE_SIZE),
    [collectionId],
  );
  const paged = usePagedList(loadPage);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const grant = useCallback(
    async (email: string) => {
      setSaving(true);
      paged.setStatus(undefined);
      try {
        await createCollectionShare(collectionId, email);
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
    [collectionId, paged, requireLogin],
  );

  const revoke = useCallback(
    async (shareId: string) => {
      setRevoking(true);
      paged.setStatus(undefined);
      try {
        await revokeCollectionShare(collectionId, shareId);
        paged.reload();
        return true;
      } catch (error) {
        const status = failureStatus(error);
        paged.setStatus(status);
        if (status === 401) requireLogin();
        return false;
      } finally {
        setRevoking(false);
      }
    },
    [collectionId, paged, requireLogin],
  );

  return { ...paged, grant, revoking, revoke, saving };
}
