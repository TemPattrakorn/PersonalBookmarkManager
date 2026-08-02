import { Box, Button, ListItem, ListItemText, Stack, Typography } from "@mui/material";
import type { Bookmark } from "../types";

type Props = {
  bookmark: Bookmark;
  onDelete: (bookmark: Bookmark) => void;
  onEdit: (bookmark: Bookmark) => void;
};

export function BookmarkCard({ bookmark, onDelete, onEdit }: Props) {
  return (
    <ListItem
      alignItems="flex-start"
      divider
      secondaryAction={
        <Stack direction="row" spacing={1}>
          <Button onClick={() => onEdit(bookmark)} size="small">
            Edit
          </Button>
          <Button color="error" onClick={() => onDelete(bookmark)} size="small">
            Delete
          </Button>
        </Stack>
      }
    >
      <ListItemText
        primary={bookmark.title}
        secondary={
          <>
            <Box component="a" href={bookmark.url} rel="noopener noreferrer" target="_blank">
              {bookmark.url}
            </Box>
            {bookmark.notes ? <Typography component="p">{bookmark.notes}</Typography> : null}
          </>
        }
      />
    </ListItem>
  );
}
