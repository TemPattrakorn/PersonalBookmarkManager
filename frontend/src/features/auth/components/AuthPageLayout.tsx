import { Box, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      component="main"
      sx={{
        alignItems: "center",
        background:
          "radial-gradient(circle at top left, rgba(79, 70, 229, 0.13), transparent 36%), #f7f8fc",
        display: "grid",
        minHeight: "100vh",
        p: { xs: 2, sm: 4 },
      }}
    >
      <Paper
        sx={{
          border: 1,
          borderColor: "divider",
          boxShadow: "0 24px 60px rgba(17, 24, 39, 0.09)",
          justifySelf: "center",
          maxWidth: 480,
          p: { xs: 3, sm: 5 },
          width: "100%",
        }}
      >
        <Typography component="h1" variant="h4">
          Personal Bookmark Manager
        </Typography>
        {children}
      </Paper>
    </Box>
  );
}
