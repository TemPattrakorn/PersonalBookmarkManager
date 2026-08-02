import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AuthProvider } from "./auth-context";
import { AppRoutes } from "./routes/routes";

const theme = createTheme({
  palette: {
    background: { default: "#f6f7fb", paper: "#ffffff" },
    divider: "#e2e8f0",
    primary: { main: "#4F46E5" },
    text: { primary: "#1e293b", secondary: "#64748b" },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: { fontWeight: 650, textTransform: "none" },
    h4: { fontWeight: 750, letterSpacing: "-0.03em" },
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    h6: { fontWeight: 700 },
  },
  components: {
    MuiAlert: { styleOverrides: { root: { border: "1px solid" } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 10, minHeight: 40, paddingInline: 16 } },
    },
    MuiDialog: { defaultProps: { fullWidth: true, maxWidth: "xs" } },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiTextField: { defaultProps: { fullWidth: true } },
  },
});

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
