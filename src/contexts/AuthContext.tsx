import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AuthContextType = {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If the URL contains an access_token or type=signup (Supabase redirect), parse and store the session
    const handleRedirect = async () => {
      try {
        if (typeof window !== 'undefined' && (window.location.hash.includes('access_token') || window.location.search.includes('access_token') || window.location.hash.includes('type=signup'))) {
          // Supabase JS v2 may not expose getSessionFromUrl in this environment; parse the fragment manually
          const fragment = window.location.hash || window.location.search;
          const params = new URLSearchParams(fragment.replace(/^#/, '?'));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          if (access_token) {
            try {
              const { error: setError } = await supabase.auth.setSession({ access_token, refresh_token });
              if (setError) console.error('setSession error:', setError);
            } catch (e) {
              console.error('Error setting Supabase session from URL:', e);
            }
          }
           // Remove token fragment from URL to avoid leaking it
           try {
             const cleanUrl = window.location.origin + window.location.pathname + window.location.search;
             window.history.replaceState({}, document.title, cleanUrl);
           } catch (e) {
             // ignore
           }
         }
       } catch (e) {
         console.error('Error parsing Supabase redirect:', e);
       }

      // Existing onAuthStateChange and initial session fetch
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    handleRedirect();
  }, []);

  const actions = useMemo(() => ({
    signIn: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signUp: async (email: string, password: string) => {
      const redirectUrl = `${window.location.origin}/onboarding`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    resetPassword: async (email: string) => {
      const redirectUrl = `${window.location.origin}/auth/update-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      if (error) throw error;
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
