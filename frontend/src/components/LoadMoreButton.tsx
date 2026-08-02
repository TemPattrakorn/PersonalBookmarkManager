import { Button } from "@mui/material";

export function LoadMoreButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <Button disabled={disabled} onClick={onClick} sx={{ mt: 1 }} variant="outlined">
      {disabled ? "Loading…" : "Load more"}
    </Button>
  );
}
