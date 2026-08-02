import { Alert, AppBar, Box, Button, Container, Stack, Toolbar, Typography } from "@mui/material";
import { useState, type ReactNode } from "react";
import { Link as RouterLink, useLocation } from "react-router";
import { useAuth } from "../auth-context";

export function WorkspaceLayout({ children, title }: { children: ReactNode; title: string }) {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const [signingOut, setSigningOut] = useState(false);
  const [logoutFailed, setLogoutFailed] = useState(false);

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar color="inherit" elevation={0} position="sticky" sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ alignItems: { sm: "center", xs: "stretch" }, flexDirection: { sm: "row", xs: "column" }, gap: { sm: 3, xs: 1.5 }, justifyContent: "space-between", py: { sm: 1, xs: 1.5 } }}>
            <Typography component="div" sx={{ whiteSpace: "nowrap" }} variant="h6">Personal Bookmark Manager</Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
              <Button aria-current={pathname === "/collections" ? "page" : undefined} component={RouterLink} size="small" to="/collections" variant={pathname === "/collections" ? "contained" : "text"}>Collections</Button>
              <Button aria-current={pathname === "/bookmarks" ? "page" : undefined} component={RouterLink} size="small" to="/bookmarks" variant={pathname === "/bookmarks" ? "contained" : "text"}>Bookmarks</Button>
              <Button disabled={signingOut} onClick={() => { setSigningOut(true); setLogoutFailed(false); void logout().catch(() => { setSigningOut(false); setLogoutFailed(true); }); }} size="small" variant="outlined">Sign out</Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: { sm: 5, xs: 3 } }}>
        <Typography component="h1" variant="h4">{title}</Typography>
        {logoutFailed ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            We couldn&apos;t sign you out. Please try again.
          </Alert>
        ) : null}
        {children}
      </Container>
    </Box>
  );
}
