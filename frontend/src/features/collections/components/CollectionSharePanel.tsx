import { Button, CircularProgress, List, ListItem, ListItemText, Paper, Stack, TextField, Typography } from "@mui/material";
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
    <Paper sx={{ backgroundColor: "action.hover", border: 1, borderColor: "divider", p: 2, width: "100%" }}>
      <Stack spacing={2}>
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
      <RequestFailure onRetry={shares.retryable ? shares.reload : undefined} status={shares.status} />
      {shares.loading && !shares.loaded ? (
        <Stack role="status" sx={{ alignItems: "center" }}>
          <CircularProgress aria-label="Loading collection shares" />
        </Stack>
      ) : shares.loaded ? (
        <List aria-label="Current grantees" disablePadding>
          {shares.items.map((share) => (
            <ListItem
              divider
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
      ) : null}
      {shares.hasMore ? (
        <LoadMoreButton disabled={shares.loadingMore} onClick={() => void shares.loadMore()} />
      ) : null}
      </Stack>
    </Paper>
  );
}
