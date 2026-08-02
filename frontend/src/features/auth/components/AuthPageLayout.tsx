import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <Box component="main" sx={{ margin: "0 auto", maxWidth: 720, p: 4 }}>
      <Typography component="h1" variant="h4">
        Personal Bookmark Manager
      </Typography>
      {children}
    </Box>
  );
}
