import { Button, ListItem, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router";
import type { Collection } from "../types";

type Props = {
  collection: Collection;
  onDelete?: (collection: Collection) => void;
  onEdit?: (collection: Collection) => void;
  onLeave?: (collection: Collection) => void;
  onManageSharing?: (collection: Collection) => void;
};

export function CollectionCard({ collection, onDelete, onEdit, onLeave, onManageSharing }: Props) {
  return (
    <ListItem disablePadding sx={{ mb: 1 }}>
      <Paper
        sx={{
          border: 1,
          borderColor: collection.access === "viewer" ? "primary.light" : "divider",
          p: 2,
          width: "100%",
        }}
      >
        <Stack direction={{ sm: "row", xs: "column" }} spacing={2} sx={{ justifyContent: "space-between" }}>
          <Typography sx={{ minWidth: 0, overflowWrap: "anywhere" }} variant="subtitle1">
            {collection.name}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0, flexWrap: "wrap" }} useFlexGap>
          <Button
            component={RouterLink}
            size="small"
            to={`/bookmarks?collectionId=${encodeURIComponent(collection.id)}`}
          >
            Bookmarks
          </Button>
          {collection.access === "owner" ? (
            <>
              <Button onClick={() => onManageSharing?.(collection)} size="small">
                Manage sharing
              </Button>
              <Button onClick={() => onEdit?.(collection)} size="small">
                Rename
              </Button>
              <Button color="error" onClick={() => onDelete?.(collection)} size="small">
                Delete
              </Button>
            </>
          ) : (
            <Button color="error" onClick={() => onLeave?.(collection)} size="small">
              Leave shared collection
            </Button>
          )}
          </Stack>
        </Stack>
      </Paper>
    </ListItem>
  );
}
