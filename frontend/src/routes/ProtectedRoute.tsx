import { CircularProgress, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useAuth } from "../auth-context";
import { AuthPageLayout } from "../features/auth/components/AuthPageLayout";
import { SignInPage } from "../features/auth/pages/SignInPage";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  if (session === "loading") {
    return (
      <AuthPageLayout>
        <Stack role="status" spacing={2} sx={{ alignItems: "center", mt: 4 }}>
          <CircularProgress aria-label="Loading secure workspace" />
          <Typography>Loading secure workspace…</Typography>
        </Stack>
      </AuthPageLayout>
    );
  }
  if (session === "error") return <SignInPage error />;
  if (session === "signed-out") return <SignInPage />;
  return children;
}
