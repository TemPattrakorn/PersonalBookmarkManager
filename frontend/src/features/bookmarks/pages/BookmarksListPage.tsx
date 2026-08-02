import { CircularProgress, Divider, List, ListItem, Stack } from "@mui/material";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { LoadMoreButton } from "../../../components/LoadMoreButton";
import { RequestFailure } from "../../../components/RequestFailure";
import { WorkspaceLayout } from "../../../components/WorkspaceLayout";
import { BookmarkCard } from "../components/BookmarkCard";
import { BookmarkDeleteDialog } from "../components/BookmarkDeleteDialog";
import { BookmarkFilters } from "../components/BookmarkFilters";
import { BookmarkForm } from "../components/BookmarkForm";
import { useBookmarks } from "../hooks/useBookmarks";
import type { Bookmark } from "../types";

export function BookmarksListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const collectionFilter = searchParams.get("collectionId") ?? undefined;
  const bookmarks = useBookmarks(collectionFilter);
  const [editing, setEditing] = useState<Bookmark>();
  const [deleting, setDeleting] = useState<Bookmark>();
  const selectedFilter = bookmarks.collections.some((collection) => collection.id === collectionFilter)
    ? (collectionFilter ?? "")
    : "";

  return (
    <WorkspaceLayout title="Bookmarks">
      <BookmarkForm
        collections={bookmarks.collections}
        editing={editing}
        onCancel={() => setEditing(undefined)}
        onSubmit={async (input) => {
          const saved = await bookmarks.save(editing, input);
          if (saved) setEditing(undefined);
          return saved;
        }}
        saving={bookmarks.saving}
      />
      <Divider sx={{ my: 4 }} />
      <BookmarkFilters
        collections={bookmarks.collections}
        onChange={(collectionId) => setSearchParams(collectionId ? { collectionId } : {})}
        value={selectedFilter}
      />
      <RequestFailure status={bookmarks.collectionsStatus ?? bookmarks.status} />
      {bookmarks.loading ? (
        <Stack role="status" sx={{ alignItems: "center", mt: 4 }}>
          <CircularProgress aria-label="Loading bookmarks" />
        </Stack>
      ) : (
        <List aria-label="Your bookmarks" sx={{ mt: 2 }}>
          {bookmarks.items.map((bookmark) => (
            <BookmarkCard bookmark={bookmark} key={bookmark.id} onDelete={setDeleting} onEdit={setEditing} />
          ))}
          {bookmarks.items.length === 0 ? <ListItem>Your bookmarks will appear here.</ListItem> : null}
        </List>
      )}
      {bookmarks.hasMore ? (
        <LoadMoreButton disabled={bookmarks.loadingMore} onClick={() => void bookmarks.loadMore()} />
      ) : null}
      <BookmarkDeleteDialog
        bookmark={deleting}
        deleting={bookmarks.deleting}
        onClose={() => setDeleting(undefined)}
        onConfirm={() => {
          if (!deleting) return;
          void bookmarks.remove(deleting).then((deleted) => {
            if (deleted) setDeleting(undefined);
          });
        }}
      />
    </WorkspaceLayout>
  );
}
