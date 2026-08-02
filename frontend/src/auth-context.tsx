import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { completeLogin, getAuthClient, signOut, startLogin } from "./auth";

type SessionState = "loading" | "signed-in" | "signed-out" | "error";

type AuthContextValue = {
  completeCallback: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  requireLogin: () => void;
  session: SessionState;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error("Authentication context is unavailable");
  }
  return auth;
}

export function AuthProvider({ children }: { children: ReactNode }) {
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

  const login = useCallback(() => startLogin(), []);
  const logout = useCallback(() => signOut(), []);
  const completeCallback = useCallback(async () => {
    await completeLogin();
    setSession("signed-in");
  }, []);
  const requireLogin = useCallback(() => setSession("signed-out"), []);

  return (
    <AuthContext.Provider value={{ completeCallback, login, logout, requireLogin, session }}>
      {children}
    </AuthContext.Provider>
  );
}
