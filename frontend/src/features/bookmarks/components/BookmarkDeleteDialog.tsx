import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import type { Bookmark } from "../types";

type Props = {
  bookmark?: Bookmark;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function BookmarkDeleteDialog({ bookmark, deleting, onClose, onConfirm }: Props) {
  return (
    <Dialog onClose={onClose} open={bookmark !== undefined}>
      <DialogTitle>Delete bookmark?</DialogTitle>
      <DialogContent>
        <DialogContentText>This cannot be undone.</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button disabled={deleting} onClick={onClose}>
          Cancel
        </Button>
        <Button color="error" disabled={deleting} onClick={onConfirm} variant="contained">
          Delete bookmark
        </Button>
      </DialogActions>
    </Dialog>
  );
}
