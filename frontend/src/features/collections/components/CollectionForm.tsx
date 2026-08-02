import { Button, Stack, TextField } from "@mui/material";
import { useEffect, useState, type FormEvent } from "react";
import type { Collection, CollectionInput } from "../types";

type Props = {
  editing?: Collection;
  onCancel: () => void;
  onSubmit: (input: CollectionInput) => Promise<boolean>;
  saving: boolean;
};

export function CollectionForm({ editing, onCancel, onSubmit, saving }: Props) {
  const [name, setName] = useState("");

  useEffect(() => setName(editing?.name ?? ""), [editing]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await onSubmit({ name })) setName("");
  };

  return (
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
        {editing ? <Button onClick={onCancel}>Cancel</Button> : null}
      </Stack>
    </Stack>
  );
}
