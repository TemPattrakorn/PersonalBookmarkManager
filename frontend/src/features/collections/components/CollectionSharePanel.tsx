import { Button, CircularProgress, List, ListItem, ListItemText, Stack, TextField, Typography } from "@mui/material";
import { useState, type FormEvent } from "react";
import { LoadMoreButton } from "../../../components/LoadMoreButton";
import { RequestFailure } from "../../../components/RequestFailure";
import { useCollectionShares } from "../hooks/useCollectionShares";

export function CollectionSharePanel({ collectionId }: { collectionId: string }) {
  const shares = useCollectionShares(collectionId);
  const [email, setEmail] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await shares.grant(email)) setEmail("");
  };

  return (
    <Stack spacing={2} sx={{ pb: 2, pt: 1, width: "100%" }}>
      <Typography component="h3" variant="h6">
        Manage sharing
      </Typography>
      <Stack component="form" direction={{ sm: "row", xs: "column" }} noValidate onSubmit={submit} spacing={1}>
        <TextField
          label="Grantee email"
          onChange={(event) => setEmail(event.target.value)}
          required
          slotProps={{ htmlInput: { maxLength: 254 } }}
          type="email"
          value={email}
        />
        <Button disabled={shares.saving} type="submit" variant="contained">
          {shares.saving ? "Sharing…" : "Share collection"}
        </Button>
      </Stack>
      <RequestFailure status={shares.status} />
      {shares.loading ? (
        <Stack role="status" sx={{ alignItems: "center" }}>
          <CircularProgress aria-label="Loading collection shares" />
        </Stack>
      ) : (
        <List aria-label="Current grantees">
          {shares.items.map((share) => (
            <ListItem
              key={share.id}
              secondaryAction={
                <Button
                  color="error"
                  disabled={shares.revoking}
                  onClick={() => void shares.revoke(share.id)}
                  size="small"
                >
                  Revoke
                </Button>
              }
            >
              <ListItemText primary={share.email} />
            </ListItem>
          ))}
          {shares.items.length === 0 ? <ListItem>No one has access yet.</ListItem> : null}
        </List>
      )}
      {shares.hasMore ? (
        <LoadMoreButton disabled={shares.loadingMore} onClick={() => void shares.loadMore()} />
      ) : null}
    </Stack>
  );
}
