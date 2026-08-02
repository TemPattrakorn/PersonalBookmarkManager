import { MenuItem, TextField } from "@mui/material";
import type { Collection } from "../../collections/types";

type Props = {
  collections: Collection[];
  onChange: (collectionId: string) => void;
  value: string;
};

export function BookmarkFilters({ collections, onChange, value }: Props) {
  return (
    <TextField
      label="Filter by collection"
      onChange={(event) => onChange(event.target.value)}
      select
      value={value}
    >
      <MenuItem value="">All bookmarks</MenuItem>
      {collections.map((collection) => (
        <MenuItem key={collection.id} value={collection.id}>
          {collection.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
