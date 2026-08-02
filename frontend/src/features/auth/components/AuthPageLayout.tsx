import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <Box component="main" sx={{ alignItems: "center", display: "grid", minHeight: "100vh", p: { sm: 4, xs: 2 } }}>
      <Paper sx={{ border: 1, borderColor: "divider", boxShadow: "0 20px 48px rgba(15, 23, 42, 0.08)", justifySelf: "center", maxWidth: 480, p: { sm: 5, xs: 3 }, width: "100%" }}>
        <Typography component="h1" variant="h4">Personal Bookmark Manager</Typography>
        {children}
      </Paper>
    </Box>
  );
}
