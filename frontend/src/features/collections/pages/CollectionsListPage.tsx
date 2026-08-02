import { CircularProgress, List, ListItem, Stack } from "@mui/material";
import { useState } from "react";
import { LoadMoreButton } from "../../../components/LoadMoreButton";
import { RequestFailure } from "../../../components/RequestFailure";
import { WorkspaceLayout } from "../../../components/WorkspaceLayout";
import { CollectionCard } from "../components/CollectionCard";
import { CollectionDeleteDialog } from "../components/CollectionDeleteDialog";
import { CollectionForm } from "../components/CollectionForm";
import { useCollections } from "../hooks/useCollections";
import type { Collection } from "../types";

export function CollectionsListPage() {
  const collections = useCollections();
  const [editing, setEditing] = useState<Collection>();
  const [deleting, setDeleting] = useState<Collection>();

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
      <RequestFailure status={collections.status} />
      {collections.loading ? (
        <Stack role="status" sx={{ alignItems: "center", mt: 4 }}>
          <CircularProgress aria-label="Loading collections" />
        </Stack>
      ) : (
        <List aria-label="Your collections" sx={{ mt: 2 }}>
          {collections.items.map((collection) => (
            <CollectionCard
              collection={collection}
              key={collection.id}
              onDelete={setDeleting}
              onEdit={setEditing}
            />
          ))}
          {collections.items.length === 0 ? <ListItem>Your collections will appear here.</ListItem> : null}
        </List>
      )}
      {collections.hasMore ? (
        <LoadMoreButton disabled={collections.loadingMore} onClick={() => void collections.loadMore()} />
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
    </WorkspaceLayout>
  );
}
