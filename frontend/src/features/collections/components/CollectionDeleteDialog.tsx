import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import type { Collection } from "../types";

type Props = {
  collection?: Collection;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function CollectionDeleteDialog({ collection, deleting, onClose, onConfirm }: Props) {
  return (
    <Dialog onClose={onClose} open={collection !== undefined}>
      <DialogTitle>Delete collection?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Bookmarks in this collection will be kept and become uncategorized.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button disabled={deleting} onClick={onClose}>
          Cancel
        </Button>
        <Button color="error" disabled={deleting} onClick={onConfirm}>
          Delete collection
        </Button>
      </DialogActions>
    </Dialog>
  );
}
