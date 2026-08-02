import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import type { Collection } from "../types";

type Props = {
  collection?: Collection;
  leaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function CollectionLeaveDialog({ collection, leaving, onClose, onConfirm }: Props) {
  return (
    <Dialog onClose={onClose} open={collection !== undefined}>
      <DialogTitle>Leave shared collection?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You will lose access to this collection and its current bookmarks. This will not delete them.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button disabled={leaving} onClick={onClose}>
          Cancel
        </Button>
        <Button color="error" disabled={leaving} onClick={onConfirm} variant="contained">
          Leave shared collection
        </Button>
      </DialogActions>
    </Dialog>
  );
}
