import { CircularProgress, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../../auth-context";
import { AuthPageLayout } from "../components/AuthPageLayout";
import { SignInPage } from "./SignInPage";

export function CallbackPage() {
  const { completeCallback } = useAuth();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let active = true;
    void completeCallback()
      .then(() => navigate("/collections", { replace: true }))
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [completeCallback, navigate]);

  if (failed) return <SignInPage error />;

  return (
    <AuthPageLayout>
      <Stack role="status" spacing={2} sx={{ alignItems: "center", mt: 4 }}>
        <CircularProgress aria-label="Completing sign in" />
        <Typography>Completing sign in…</Typography>
      </Stack>
    </AuthPageLayout>
  );
}
