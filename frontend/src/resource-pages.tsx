import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { apiRequest, failureStatus } from "./api/client";
import { useAuth } from "./auth-context";
import { LoadMoreButton } from "./components/LoadMoreButton";
import { RequestFailure } from "./components/RequestFailure";
import { WorkspaceLayout } from "./components/WorkspaceLayout";
import type { Bookmark } from "./features/bookmarks/types";
import type { Collection } from "./features/collections/types";
import { PAGE_SIZE, usePagedList } from "./hooks/usePagedList";
export { CollectionsListPage as CollectionsPage } from "./features/collections/pages/CollectionsListPage";

export function BookmarksPage() {
  const { requireLogin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const collectionFilter = searchParams.get("collectionId") ?? undefined;
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsStatus, setCollectionsStatus] = useState<number>();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [editing, setEditing] = useState<Bookmark>();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Bookmark>();
  const [deletingNow, setDeletingNow] = useState(false);

  useEffect(() => {
    let active = true;
    void apiRequest<Collection[]>("/collections?limit=100&offset=0")
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
    (offset: number) => {
      const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (collectionFilter) query.set("collectionId", collectionFilter);
      return apiRequest<Bookmark[]>(`/bookmarks?${query.toString()}`);
    },
    [collectionFilter],
  );
  const { hasMore, items, loadMore, loading, loadingMore, reload, setStatus, status } =
    usePagedList(loadPage);

  const clearForm = () => {
    setCollectionId("");
    setEditing(undefined);
    setNotes("");
    setTitle("");
    setUrl("");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus(undefined);
    const body = {
      collectionId: collectionId || null,
      notes: notes.trim() ? notes : null,
      title,
      url,
    };
    try {
      if (editing) {
        await apiRequest<Bookmark>(`/bookmarks/${editing.id}`, {
          body: JSON.stringify(body),
          method: "PATCH",
        });
      } else {
        await apiRequest<Bookmark>("/bookmarks", {
          body: JSON.stringify(body),
          method: "POST",
        });
      }
      clearForm();
      reload();
    } catch (error) {
      const status = failureStatus(error);
      setStatus(status);
      if (status === 401) requireLogin();
    } finally {
      setSaving(false);
    }
  };

  const deleteBookmark = async () => {
    if (!deleting) return;
    setDeletingNow(true);
    setStatus(undefined);
    try {
      await apiRequest<void>(`/bookmarks/${deleting.id}`, { method: "DELETE" });
      setDeleting(undefined);
      reload();
    } catch (error) {
      const status = failureStatus(error);
      setStatus(status);
      if (status === 401) requireLogin();
    } finally {
      setDeletingNow(false);
    }
  };

  const selectedFilter = collections.some((collection) => collection.id === collectionFilter)
    ? collectionFilter
    : "";

  return (
    <WorkspaceLayout title="Bookmarks">
      <Stack component="form" noValidate onSubmit={submit} spacing={2} sx={{ mt: 3 }}>
        <TextField
          label="Title"
          onChange={(event) => setTitle(event.target.value)}
          required
          slotProps={{ htmlInput: { maxLength: 200 } }}
          value={title}
        />
        <TextField
          label="URL"
          onChange={(event) => setUrl(event.target.value)}
          required
          slotProps={{ htmlInput: { maxLength: 2048 } }}
          type="url"
          value={url}
        />
        <TextField
          label="Notes"
          multiline
          onChange={(event) => setNotes(event.target.value)}
          slotProps={{ htmlInput: { maxLength: 5000 } }}
          value={notes}
        />
        <TextField
          label="Collection"
          onChange={(event) => setCollectionId(event.target.value)}
          select
          value={collectionId}
        >
          <MenuItem value="">Uncategorized</MenuItem>
          {collections.map((collection) => (
            <MenuItem key={collection.id} value={collection.id}>
              {collection.name}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction="row" spacing={1}>
          <Button disabled={saving} type="submit" variant="contained">
            {saving ? "Saving…" : editing ? "Save bookmark" : "Add bookmark"}
          </Button>
          {editing ? <Button onClick={clearForm}>Cancel</Button> : null}
        </Stack>
      </Stack>
      <Divider sx={{ my: 4 }} />
      <TextField
        label="Filter by collection"
        onChange={(event) => {
          const next = event.target.value;
          setSearchParams(next ? { collectionId: next } : {});
        }}
        select
        value={selectedFilter}
      >
        <MenuItem value="">All bookmarks</MenuItem>
        {collections.map((collection) => (
          <MenuItem key={collection.id} value={collection.id}>
            {collection.name}
          </MenuItem>
        ))}
      </TextField>
      <RequestFailure status={collectionsStatus ?? status} />
      {loading ? (
        <Stack role="status" sx={{ alignItems: "center", mt: 4 }}>
          <CircularProgress aria-label="Loading bookmarks" />
        </Stack>
      ) : (
        <List aria-label="Your bookmarks" sx={{ mt: 2 }}>
          {items.map((bookmark) => (
            <ListItem
              alignItems="flex-start"
              divider
              key={bookmark.id}
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <Button
                    onClick={() => {
                      setCollectionId(bookmark.collectionId ?? "");
                      setEditing(bookmark);
                      setNotes(bookmark.notes ?? "");
                      setTitle(bookmark.title);
                      setUrl(bookmark.url);
                    }}
                    size="small"
                  >
                    Edit
                  </Button>
                  <Button color="error" onClick={() => setDeleting(bookmark)} size="small">
                    Delete
                  </Button>
                </Stack>
              }
            >
              <ListItemText
                primary={bookmark.title}
                secondary={
                  <>
                    <Box component="a" href={bookmark.url} rel="noopener noreferrer" target="_blank">
                      {bookmark.url}
                    </Box>
                    {bookmark.notes ? <Typography component="p">{bookmark.notes}</Typography> : null}
                  </>
                }
              />
            </ListItem>
          ))}
          {items.length === 0 ? <ListItem>Your bookmarks will appear here.</ListItem> : null}
        </List>
      )}
      {hasMore ? <LoadMoreButton disabled={loadingMore} onClick={() => void loadMore()} /> : null}
      <Dialog onClose={() => setDeleting(undefined)} open={deleting !== undefined}>
        <DialogTitle>Delete bookmark?</DialogTitle>
        <DialogContent>
          <DialogContentText>This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={deletingNow} onClick={() => setDeleting(undefined)}>
            Cancel
          </Button>
          <Button color="error" disabled={deletingNow} onClick={() => void deleteBookmark()}>
            Delete bookmark
          </Button>
        </DialogActions>
      </Dialog>
    </WorkspaceLayout>
  );
}
