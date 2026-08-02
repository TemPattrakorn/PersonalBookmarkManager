import { CircularProgress, List, ListItem, Stack, Typography } from "@mui/material";
import { Fragment, useState } from "react";
import { LoadMoreButton } from "../../../components/LoadMoreButton";
import { RequestFailure } from "../../../components/RequestFailure";
import { WorkspaceLayout } from "../../../components/WorkspaceLayout";
import { CollectionCard } from "../components/CollectionCard";
import { CollectionDeleteDialog } from "../components/CollectionDeleteDialog";
import { CollectionForm } from "../components/CollectionForm";
import { CollectionLeaveDialog } from "../components/CollectionLeaveDialog";
import { CollectionSharePanel } from "../components/CollectionSharePanel";
import { useCollections } from "../hooks/useCollections";
import type { Collection } from "../types";

export function CollectionsListPage() {
  const collections = useCollections();
  const sharedCollections = useCollections("shared");
  const [editing, setEditing] = useState<Collection>();
  const [deleting, setDeleting] = useState<Collection>();
  const [leaving, setLeaving] = useState<Collection>();
  const [sharing, setSharing] = useState<Collection>();

  return (
    <WorkspaceLayout title="Collections">
      <CollectionForm
        editing={editing}
        onCancel={() => setEditing(undefined)}
        onSubmit={async (input) => {
          const saved = await collections.save(editing, input);
          if (saved) setEditing(undefined);
          return saved;
        }}
        saving={collections.saving}
      />
      <RequestFailure
        onRetry={collections.retryable ? collections.reload : undefined}
        status={collections.status}
      />
      {collections.loading && !collections.loaded ? (
        <Stack role="status" sx={{ alignItems: "center", mt: 4 }}>
          <CircularProgress aria-label="Loading collections" />
        </Stack>
      ) : collections.loaded ? (
        <List aria-label="Your collections" sx={{ mt: 2 }}>
          {collections.items.map((collection) => (
            <Fragment key={collection.id}>
              <CollectionCard
                collection={collection}
                onDelete={setDeleting}
                onEdit={setEditing}
                onManageSharing={(selected) =>
                  setSharing((current) => (current?.id === selected.id ? undefined : selected))
                }
              />
              {sharing?.id === collection.id ? (
                <ListItem disableGutters>
                  <CollectionSharePanel collectionId={collection.id} />
                </ListItem>
              ) : null}
            </Fragment>
          ))}
          {collections.items.length === 0 ? <ListItem>Your collections will appear here.</ListItem> : null}
        </List>
      ) : null}
      {collections.hasMore ? (
        <LoadMoreButton disabled={collections.loadingMore} onClick={() => void collections.loadMore()} />
      ) : null}
      <Typography component="h2" sx={{ mt: 4 }} variant="h5">
        Shared by others
      </Typography>
      <RequestFailure
        onRetry={sharedCollections.retryable ? sharedCollections.reload : undefined}
        status={sharedCollections.status}
      />
      {sharedCollections.loading && !sharedCollections.loaded ? (
        <Stack role="status" sx={{ alignItems: "center", mt: 2 }}>
          <CircularProgress aria-label="Loading shared collections" />
        </Stack>
      ) : sharedCollections.loaded ? (
        <List aria-label="Collections shared by others" sx={{ mt: 2 }}>
          {sharedCollections.items.map((collection) => (
            <CollectionCard collection={collection} key={collection.id} onLeave={setLeaving} />
          ))}
          {sharedCollections.items.length === 0 ? <ListItem>No shared collections.</ListItem> : null}
        </List>
      ) : null}
      {sharedCollections.hasMore ? (
        <LoadMoreButton
          disabled={sharedCollections.loadingMore}
          onClick={() => void sharedCollections.loadMore()}
        />
      ) : null}
      <CollectionDeleteDialog
        collection={deleting}
        deleting={collections.deleting}
        onClose={() => setDeleting(undefined)}
        onConfirm={() => {
          if (!deleting) return;
          void collections.remove(deleting).then((deleted) => {
            if (deleted) setDeleting(undefined);
          });
        }}
      />
      <CollectionLeaveDialog
        collection={leaving}
        leaving={sharedCollections.deleting}
        onClose={() => setLeaving(undefined)}
        onConfirm={() => {
          if (!leaving) return;
          void sharedCollections.leave(leaving).then((left) => {
            if (left) setLeaving(undefined);
          });
        }}
      />
    </WorkspaceLayout>
  );
}
