import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await signIn(email, password);
      // if session is returned or user is present, proceed
      const session = res?.data?.session;
      const user = res?.data?.user ?? session?.user;

      if (!user) {
        // If Supabase didn't immediately return a session/user, try to poll briefly
        const maybe = await supabase.auth.getSession().catch(() => null);
        if (maybe && maybe.data && maybe.data.session && maybe.data.session.user) {
          toast.success("Logged in successfully");
          navigate('/dashboard');
          return;
        }
        // otherwise still navigate; AuthProvider will populate soon
      }

      toast.success("Logged in successfully");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <Helmet><title>Log in | QuickFlow</title><meta name="description" content="Access your QuickFlow account." /></Helmet>
      <div className="container py-16 grid place-items-center">
        <div className="w-full max-w-md rounded-xl border p-6">
          <h1 className="text-2xl font-semibold mb-4">Log in</h1>
          <div className="grid gap-3">
            <input placeholder="Email" className="rounded-md border bg-background px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="rounded-md border bg-background px-3 py-2" value={password} onChange={e=>setPassword(e.target.value)} />
            <Button variant="hero" onClick={handleLogin} disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Log in'
              )}
            </Button>
            <a className="text-sm text-primary underline-offset-4 hover:underline" href="/auth/reset">Forgot password?</a>
            <div className="text-sm">No account? <a className="text-primary underline-offset-4 hover:underline" href="/auth/signup">Sign up</a></div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Login;
