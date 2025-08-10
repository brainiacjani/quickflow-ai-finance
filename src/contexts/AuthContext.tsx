import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AuthContextType = {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = "qf_user";

const readLocalUser = () => {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(readLocalUser());
    setLoading(false);
  }, []);

  const actions = useMemo(() => ({
    signIn: async (email: string, _password: string) => {
      const mock = { id: "local-user", email };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mock));
      setUser(mock);
    },
    signUp: async (email: string, _password: string) => {
      const mock = { id: "local-user", email };
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(mock));
      setUser(mock);
    },
    signOut: async () => {
      localStorage.removeItem(LOCAL_USER_KEY);
      setUser(null);
    },
    resetPassword: async (_email: string) => {
      // No-op locally
      return;
    },
  }), []);

  return (
    <AuthContext.Provider value={{ user, loading, ...actions }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
