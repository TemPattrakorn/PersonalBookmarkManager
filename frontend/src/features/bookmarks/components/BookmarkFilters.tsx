import { MenuItem, TextField } from "@mui/material";
import type { Collection } from "../../collections/types";

type Props = {
  activeCollection?: Collection;
  collections: Collection[];
  onChange: (collectionId: string) => void;
  value: string;
};

export function BookmarkFilters({ activeCollection, collections, onChange, value }: Props) {
  const options =
    activeCollection?.access === "viewer" && !collections.some((item) => item.id === activeCollection.id)
      ? [...collections, activeCollection]
      : collections;

  return (
    <TextField
      label="Filter by collection"
      onChange={(event) => onChange(event.target.value)}
      select
      value={value}
    >
      <MenuItem value="">All bookmarks</MenuItem>
      {options.map((collection) => (
        <MenuItem key={collection.id} value={collection.id}>
          {collection.name}
        </MenuItem>
      ))}
    </TextField>
  );
}
