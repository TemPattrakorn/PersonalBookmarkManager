import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useState, type ReactNode } from "react";
import { Link as RouterLink } from "react-router";
import { useAuth } from "../auth-context";

export function WorkspaceLayout({ children, title }: { children: ReactNode; title: string }) {
  const { logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [logoutFailed, setLogoutFailed] = useState(false);

  return (
    <Box component="main" sx={{ margin: "0 auto", maxWidth: 960, p: 4 }}>
      <Stack
        direction={{ sm: "row", xs: "column" }}
        spacing={2}
        sx={{ justifyContent: "space-between" }}
      >
        <Typography component="h1" variant="h4">
          Personal Bookmark Manager
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/collections">
            Collections
          </Button>
          <Button component={RouterLink} to="/bookmarks">
            Bookmarks
          </Button>
          <Button
            disabled={signingOut}
            onClick={() => {
              setSigningOut(true);
              setLogoutFailed(false);
              void logout().catch(() => {
                setSigningOut(false);
                setLogoutFailed(true);
              });
            }}
            variant="outlined"
          >
            Sign out
          </Button>
        </Stack>
      </Stack>
      <Typography component="h2" sx={{ mt: 4 }} variant="h5">
        {title}
      </Typography>
      {logoutFailed ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          We couldn&apos;t sign you out. Please try again.
        </Alert>
      ) : null}
      {children}
    </Box>
  );
}
