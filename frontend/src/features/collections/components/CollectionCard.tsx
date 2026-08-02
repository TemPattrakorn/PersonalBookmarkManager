import { Button, ListItem, ListItemText, Stack } from "@mui/material";
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
    <ListItem
      divider
      secondaryAction={
        <Stack direction="row" spacing={1}>
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
      }
    >
      <ListItemText primary={collection.name} />
    </ListItem>
  );
}
