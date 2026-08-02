import {
  Alert,
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
import { Link as RouterLink, useSearchParams } from "react-router";
import { ApiError, apiRequest, type Bookmark, type Collection } from "./api";
import { useAuth } from "./auth-context";

const PAGE_SIZE = 50;

function failureMessage(status: number | undefined): string | undefined {
  if (status === undefined) return undefined;
  if (status === 400) return "Check your input and try again.";
  if (status === 401) return "Please sign in again.";
  if (status === 503) return "The service is unavailable. Please try again shortly.";
  return "We couldn’t complete that request. Please try again.";
}

function failureStatus(error: unknown): number {
  return error instanceof ApiError ? error.status : 500;
}

function Workspace({ children, title }: { children: React.ReactNode; title: string }) {
  const { logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [logoutFailed, setLogoutFailed] = useState(false);

  return (
    <Box component="main" sx={{ margin: "0 auto", maxWidth: 960, p: 4 }}>
      <Stack
        direction={{ sm: "row", xs: "column" }}
        spacing={2}
        sx={{ justifyContent: "space-between" }}
      >
        <Typography component="h1" variant="h4">
          Personal Bookmark Manager
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/collections">
            Collections
          </Button>
          <Button component={RouterLink} to="/bookmarks">
            Bookmarks
          </Button>
          <Button
            disabled={signingOut}
            onClick={() => {
              setSigningOut(true);
              setLogoutFailed(false);
              void logout().catch(() => {
                setSigningOut(false);
                setLogoutFailed(true);
              });
            }}
            variant="outlined"
          >
            Sign out
          </Button>
        </Stack>
      </Stack>
      <Typography component="h2" sx={{ mt: 4 }} variant="h5">
        {title}
      </Typography>
      {logoutFailed ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          We couldn&apos;t sign you out. Please try again.
        </Alert>
      ) : null}
      {children}
    </Box>
  );
}

function usePagedList<T>(loadPage: (offset: number) => Promise<T[]>) {
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

function RequestFailure({ status }: { status: number | undefined }) {
  const message = failureMessage(status);
  return message ? (
    <Alert severity={status === 400 ? "warning" : "error"} sx={{ mt: 2 }}>
      {message}
    </Alert>
  ) : null;
}

function LoadMore({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <Button disabled={disabled} onClick={onClick} sx={{ mt: 2 }} variant="outlined">
      {disabled ? "Loading…" : "Load more"}
    </Button>
  );
}

export function CollectionsPage() {
  const { requireLogin } = useAuth();
  const loadPage = useCallback(
    (offset: number) => apiRequest<Collection[]>(`/collections?limit=${PAGE_SIZE}&offset=${offset}`),
    [],
  );
  const { hasMore, items, loadMore, loading, loadingMore, reload, setStatus, status } =
    usePagedList(loadPage);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Collection>();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Collection>();
  const [deletingNow, setDeletingNow] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus(undefined);
    try {
      if (editing) {
        await apiRequest<Collection>(`/collections/${editing.id}`, {
          body: JSON.stringify({ name }),
          method: "PATCH",
        });
      } else {
        await apiRequest<Collection>("/collections", {
          body: JSON.stringify({ name }),
          method: "POST",
        });
      }
      setEditing(undefined);
      setName("");
      reload();
    } catch (error) {
      const status = failureStatus(error);
      setStatus(status);
      if (status === 401) requireLogin();
    } finally {
      setSaving(false);
    }
  };

  const deleteCollection = async () => {
    if (!deleting) return;
    setDeletingNow(true);
    setStatus(undefined);
    try {
      await apiRequest<void>(`/collections/${deleting.id}`, { method: "DELETE" });
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

  return (
    <Workspace title="Collections">
      <Stack component="form" noValidate onSubmit={submit} spacing={2} sx={{ mt: 3 }}>
        <TextField
          label="Collection name"
          onChange={(event) => setName(event.target.value)}
          required
          slotProps={{ htmlInput: { maxLength: 100 } }}
          value={name}
        />
        <Stack direction="row" spacing={1}>
          <Button disabled={saving} type="submit" variant="contained">
            {saving ? "Saving…" : editing ? "Save collection" : "Add collection"}
          </Button>
          {editing ? (
            <Button
              onClick={() => {
                setEditing(undefined);
                setName("");
              }}
            >
              Cancel
            </Button>
          ) : null}
        </Stack>
      </Stack>
      <RequestFailure status={status} />
      {loading ? (
        <Stack role="status" sx={{ alignItems: "center", mt: 4 }}>
          <CircularProgress aria-label="Loading collections" />
        </Stack>
      ) : (
        <List aria-label="Your collections" sx={{ mt: 2 }}>
          {items.map((collection) => (
            <ListItem
              divider
              key={collection.id}
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <Button
                    component={RouterLink}
                    size="small"
                    to={`/bookmarks?collectionId=${encodeURIComponent(collection.id)}`}
                  >
                    Bookmarks
                  </Button>
                  <Button
                    onClick={() => {
                      setEditing(collection);
                      setName(collection.name);
                    }}
                    size="small"
                  >
                    Rename
                  </Button>
                  <Button color="error" onClick={() => setDeleting(collection)} size="small">
                    Delete
                  </Button>
                </Stack>
              }
            >
              <ListItemText primary={collection.name} />
            </ListItem>
          ))}
          {items.length === 0 ? <ListItem>Your collections will appear here.</ListItem> : null}
        </List>
      )}
      {hasMore ? <LoadMore disabled={loadingMore} onClick={() => void loadMore()} /> : null}
      <Dialog onClose={() => setDeleting(undefined)} open={deleting !== undefined}>
        <DialogTitle>Delete collection?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bookmarks in this collection will be kept and become uncategorized.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={deletingNow} onClick={() => setDeleting(undefined)}>
            Cancel
          </Button>
          <Button color="error" disabled={deletingNow} onClick={() => void deleteCollection()}>
            Delete collection
          </Button>
        </DialogActions>
      </Dialog>
    </Workspace>
  );
}

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
    <Workspace title="Bookmarks">
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
      {hasMore ? <LoadMore disabled={loadingMore} onClick={() => void loadMore()} /> : null}
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
    </Workspace>
  );
}
