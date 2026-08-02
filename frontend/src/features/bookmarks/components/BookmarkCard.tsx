import { Box, Button, ListItem, Paper, Stack, Typography } from "@mui/material";
import type { Bookmark } from "../types";

type Props = {
  bookmark: Bookmark;
  onDelete?: (bookmark: Bookmark) => void;
  onEdit?: (bookmark: Bookmark) => void;
};

export function BookmarkCard({ bookmark, onDelete, onEdit }: Props) {
  return (
    <ListItem disablePadding sx={{ mb: 1 }}>
      <Paper sx={{ border: 1, borderColor: bookmark.access === "viewer" ? "primary.light" : "divider", p: 2, width: "100%" }}>
        <Stack direction={{ sm: "row", xs: "column" }} spacing={2} sx={{ justifyContent: "space-between" }}>
          <Stack spacing={0.75} sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1">{bookmark.title}</Typography>
            <Box component="a" href={bookmark.url} rel="noopener noreferrer" sx={{ color: "primary.main", overflowWrap: "anywhere" }} target="_blank">
              {bookmark.url}
            </Box>
            {bookmark.notes ? <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>{bookmark.notes}</Typography> : null}
          </Stack>
          {bookmark.access === "owner" ? (
            <Stack direction="row" spacing={1} sx={{ alignSelf: { sm: "flex-start" }, flexShrink: 0, flexWrap: "wrap" }} useFlexGap>
            <Button onClick={() => onEdit?.(bookmark)} size="small">
              Edit
            </Button>
            <Button color="error" onClick={() => onDelete?.(bookmark)} size="small">
              Delete
            </Button>
          </Stack>
          ) : null}
        </Stack>
      </Paper>
    </ListItem>
  );
}
