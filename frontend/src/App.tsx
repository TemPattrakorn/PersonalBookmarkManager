import { CssBaseline } from "@mui/material";
import { AuthProvider } from "./auth-context";
import { AppRoutes } from "./routes/routes";

export function App() {
  return (
    <>
      <CssBaseline />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </>
  );
}
