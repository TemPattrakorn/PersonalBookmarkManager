import { Box, Button, MenuItem, Paper, Stack, TextField } from "@mui/material";
import { useEffect, useState, type FormEvent } from "react";
import type { Collection } from "../../collections/types";
import type { Bookmark, BookmarkInput } from "../types";

type Props = {
  collections: Collection[];
  editing?: Bookmark;
  onCancel: () => void;
  onSubmit: (input: BookmarkInput) => Promise<boolean>;
  saving: boolean;
};

export function BookmarkForm({ collections, editing, onCancel, onSubmit, saving }: Props) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [collectionId, setCollectionId] = useState("");

  useEffect(() => {
    setCollectionId(editing?.collectionId ?? "");
    setNotes(editing?.notes ?? "");
    setTitle(editing?.title ?? "");
    setUrl(editing?.url ?? "");
  }, [editing]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const saved = await onSubmit({
      collectionId: collectionId || null,
      notes: notes.trim() ? notes : null,
      title,
      url,
    });
    if (saved) {
      setCollectionId("");
      setNotes("");
      setTitle("");
      setUrl("");
    }
  };

  return (
    <Paper component="form" noValidate onSubmit={submit} sx={{ border: 1, borderColor: "divider", mt: 3, p: 2 }}>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))", xs: "1fr" } }}>
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
          sx={{ gridColumn: { sm: "1 / -1" } }}
          value={notes}
        />
        <TextField label="Collection" onChange={(event) => setCollectionId(event.target.value)} select value={collectionId}>
          <MenuItem value="">Uncategorized</MenuItem>
          {collections.map((collection) => (
            <MenuItem key={collection.id} value={collection.id}>
              {collection.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 2 }} useFlexGap>
        <Button disabled={saving} type="submit" variant="contained">
          {saving ? "Saving…" : editing ? "Save bookmark" : "Add bookmark"}
        </Button>
        {editing ? <Button onClick={onCancel}>Cancel</Button> : null}
      </Stack>
    </Paper>
  );
}
