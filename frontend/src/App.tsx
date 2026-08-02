import { Box, CssBaseline, Typography } from "@mui/material";

export function App() {
  return (
    <>
      <CssBaseline />
      <Box component="main" sx={{ p: 4 }}>
        <Typography component="h1" variant="h4">
          Personal Bookmark Manager
        </Typography>
        <Typography sx={{ mt: 2 }}>Phase 1 foundation is ready.</Typography>
      </Box>
    </>
  );
}
