import { Alert, Button } from "@mui/material";

function failureMessage(status: number | undefined): string | undefined {
  if (status === undefined) return undefined;
  if (status === 400) return "Check your input and try again.";
  if (status === 401) return "Please sign in again.";
  if (status === 503) return "The service is unavailable. Please try again shortly.";
  return "We couldn’t complete that request. Please try again.";
}

export function RequestFailure({
  onRetry,
  status,
}: {
  onRetry?: () => void;
  status: number | undefined;
}) {
  const message = failureMessage(status);
  return message ? (
    <Alert
      action={onRetry ? <Button color="inherit" onClick={onRetry}>Retry</Button> : undefined}
      severity={status === 400 ? "warning" : "error"}
      sx={{ mt: 2, wordBreak: "break-word" }}
    >
      {message}
    </Alert>
  ) : null;
}
