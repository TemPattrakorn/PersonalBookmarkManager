import { Button, Paper, Stack, TextField } from "@mui/material";
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
    <Paper component="form" noValidate onSubmit={submit} sx={{ border: 1, borderColor: "divider", mt: 3, p: 2 }}>
      <Stack direction={{ sm: "row", xs: "column" }} spacing={2}>
        <TextField
          label="Collection name"
          onChange={(event) => setName(event.target.value)}
          required
          slotProps={{ htmlInput: { maxLength: 100 } }}
          sx={{ flex: 1 }}
          value={name}
        />
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
          <Button disabled={saving} type="submit" variant="contained">
            {saving ? "Saving…" : editing ? "Save collection" : "Add collection"}
          </Button>
          {editing ? <Button onClick={onCancel}>Cancel</Button> : null}
        </Stack>
      </Stack>
    </Paper>
  );
}
