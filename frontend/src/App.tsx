import {
  Alert,
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  Stack,
  Typography,
} from "@mui/material";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { completeLogin, getAuthClient, signOut, startLogin } from "./auth";

type SessionState = "loading" | "signed-in" | "signed-out" | "error";

type AuthContextValue = {
  completeCallback: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  session: SessionState;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function useAuth(): AuthContextValue {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error("Authentication context is unavailable");
  }
  return auth;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>("loading");

  useEffect(() => {
    let active = true;

    void getAuthClient()
      .then((client) => client.isAuthenticated())
      .then((authenticated) => {
        if (active) {
          setSession(authenticated ? "signed-in" : "signed-out");
        }
      })
      .catch(() => {
        if (active) {
          setSession("error");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async () => {
    await startLogin();
  }, []);

  const logout = useCallback(async () => {
    await signOut();
  }, []);

  const completeCallback = useCallback(async () => {
    await completeLogin();
    setSession("signed-in");
  }, []);

  return (
    <AuthContext.Provider value={{ completeCallback, login, logout, session }}>
      {children}
    </AuthContext.Provider>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <Box component="main" sx={{ margin: "0 auto", maxWidth: 720, p: 4 }}>
      <Typography component="h1" variant="h4">
        Personal Bookmark Manager
      </Typography>
      {children}
    </Box>
  );
}

function SignInPrompt({ error = false }: { error?: boolean }) {
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
    <Page>
      <Stack spacing={2} sx={{ mt: 3 }}>
        {error || failed ? (
          <Alert severity="error">We couldn&apos;t sign you in. Please try again.</Alert>
        ) : null}
        <Typography>Sign in to access your private bookmarks.</Typography>
        <Box>
          <Button disabled={submitting} onClick={() => void beginLogin()} variant="contained">
            {submitting ? "Redirecting…" : "Sign in"}
          </Button>
        </Box>
      </Stack>
    </Page>
  );
}

function ProtectedPage({ title }: { title: string }) {
  const { logout, session } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  if (session === "loading") {
    return (
      <Page>
        <Stack role="status" spacing={2} sx={{ alignItems: "center", mt: 4 }}>
          <CircularProgress aria-label="Loading secure workspace" />
          <Typography>Loading secure workspace…</Typography>
        </Stack>
      </Page>
    );
  }

  if (session === "error") {
    return <SignInPrompt error />;
  }

  if (session === "signed-out") {
    return <SignInPrompt />;
  }

  return (
    <Page>
      <Stack spacing={2} sx={{ alignItems: "flex-start", mt: 3 }}>
        <Typography component="h2" variant="h5">
          {title}
        </Typography>
        <Typography>Private resource management will be added next.</Typography>
        <Button
          disabled={signingOut}
          onClick={() => {
            setSigningOut(true);
            void logout().catch(() => setSigningOut(false));
          }}
          variant="outlined"
        >
          Sign out
        </Button>
      </Stack>
    </Page>
  );
}

function CallbackPage() {
  const { completeCallback } = useAuth();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    let active = true;

    void completeCallback()
      .then(() => navigate("/collections", { replace: true }))
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, [completeCallback, navigate]);

  if (failed) {
    return <SignInPrompt error />;
  }

  return (
    <Page>
      <Stack role="status" spacing={2} sx={{ alignItems: "center", mt: 4 }}>
        <CircularProgress aria-label="Completing sign in" />
        <Typography>Completing sign in…</Typography>
      </Stack>
    </Page>
  );
}

export function App() {
  return (
    <>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          <Route element={<Navigate replace to="/collections" />} path="/" />
          <Route element={<CallbackPage />} path="/callback" />
          <Route element={<ProtectedPage title="Collections" />} path="/collections" />
          <Route element={<ProtectedPage title="Bookmarks" />} path="/bookmarks" />
          <Route element={<Navigate replace to="/collections" />} path="*" />
        </Routes>
      </AuthProvider>
    </>
  );
}
