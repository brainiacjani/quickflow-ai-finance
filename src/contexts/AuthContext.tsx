import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AuthContextType = {
  user: any | null;
  loading: boolean;
  // return the raw Supabase auth result so callers can await session info
  signIn: (email: string, password: string) => Promise<any>;
  // signUp accepts optional profile metadata (e.g. { first_name, last_name })
  signUp: (email: string, password: string, profile?: Record<string, any>) => Promise<void>;
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
        const u = session?.user ?? null;
        setUser(u);
        // If we have a stored unconfirmed email, clear it when Supabase reports the email as confirmed
        try {
          const stored = typeof window !== 'undefined' ? localStorage.getItem('qf_unconfirmed_email') : null;
          const confirmed = !!(u && ((u as any).email_confirmed_at || (u as any).confirmed_at || (u as any).email_confirmed));
          if (stored && confirmed) {
            try { localStorage.removeItem('qf_unconfirmed_email'); } catch (e) { /* ignore */ }
          }
        } catch (e) {
          // ignore
        }
      });

      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
        // Also attempt to clear the stored flag if already confirmed
        try {
          const u = session?.user ?? null;
          const stored = typeof window !== 'undefined' ? localStorage.getItem('qf_unconfirmed_email') : null;
          const confirmed = !!(u && ((u as any).email_confirmed_at || (u as any).confirmed_at || (u as any).email_confirmed));
          if (stored && confirmed) {
            try { localStorage.removeItem('qf_unconfirmed_email'); } catch (e) { /* ignore */ }
          }
        } catch (e) {
          // ignore
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    handleRedirect();
  }, []);

  // Re-check confirmation when `user` changes (handles cases where confirmation occurs in another tab)
  useEffect(() => {
    if (!user) return;
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('qf_unconfirmed_email') : null;
      if (!stored) return;
      (async () => {
        try {
          const { data: { user: freshUser }, error } = await supabase.auth.getUser();
          if (error) return;
          const confirmed = !!(freshUser && ((freshUser as any).email_confirmed_at || (freshUser as any).confirmed_at || (freshUser as any).email_confirmed));
          if (confirmed) {
            try { localStorage.removeItem('qf_unconfirmed_email'); } catch (e) { /* ignore */ }
            setUser(freshUser);
          }
        } catch (e) {
          // ignore
        }
      })();
    } catch (e) {
      // ignore
    }
  }, [user]);

  const actions = useMemo(() => ({
    // return Supabase result so caller can act when session/user is available
    signIn: async (email: string, password: string) => {
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) throw res.error;
      // set local user immediately if available
      const userFromRes = res.data?.user ?? res.data?.session?.user ?? null;
      try { if (userFromRes) setUser(userFromRes); } catch (e) { /* ignore */ }
      return res;
    },
    signUp: async (email: string, password: string, profile?: Record<string, any>) => {
      const redirectUrl = `${window.location.origin}/onboarding`;
      // Perform signUp (this may require email confirmation depending on your Supabase settings)
      const res = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl, data: profile },
      });
      if (res.error) throw res.error;

      // Try to sign the user in immediately to create a session if allowed by your Supabase configuration.
      // If the instance requires email confirmation before sign-in, the signIn call may error — ignore that error
      // and continue to treat the account as created (we store an unconfirmed-email flag for UX).
      try {
        const signInRes = await supabase.auth.signInWithPassword({ email, password });
        if (!signInRes.error) {
          const userFromRes = signInRes.data?.user ?? signInRes.data?.session?.user ?? null;
          if (userFromRes) setUser(userFromRes);
        }
      } catch (e) {
        // ignore sign-in error (likely due to required email confirmation)
      }
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      try {
        // clear local user state and redirect to login
        setUser(null);
      } catch (e) {
        // ignore
      }
      // Use a hard redirect to ensure auth state is fully reset
      if (typeof window !== 'undefined') {
        window.location.assign('/auth/login');
      }
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
