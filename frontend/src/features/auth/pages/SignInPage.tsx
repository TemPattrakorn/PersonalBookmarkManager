import { Alert, Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useAuth } from "../../../auth-context";
import { AuthPageLayout } from "../components/AuthPageLayout";

export function SignInPage({ error = false }: { error?: boolean }) {
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);

  const beginLogin = async () => {
    setSubmitting(true);
    setFailed(false);
    try {
      await login();
    } catch {
      setSubmitting(false);
      setFailed(true);
    }
  };

  return (
    <AuthPageLayout>
      <Stack spacing={3} sx={{ mt: 3 }}>
        {error || failed ? (
          <Alert severity="error">We couldn&apos;t sign you in. Please try again.</Alert>
        ) : null}
        <Typography>Sign in to access your private bookmarks.</Typography>
        <Button disabled={submitting} fullWidth onClick={() => void beginLogin()} size="large" variant="contained">
          {submitting ? "Redirecting…" : "Sign in"}
        </Button>
      </Stack>
    </AuthPageLayout>
  );
}
