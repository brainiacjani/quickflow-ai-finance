import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Signup = () => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, { first_name: firstName, last_name: lastName });
      toast.success("Account created — a confirmation email has been sent. Please confirm your email before continuing.");
      navigate("/onboarding");
    } catch (err: any) {
      console.error('Signup error:', err);
      const msg = err?.message ?? 'Sign up failed';
      if (typeof msg === 'string' && msg.toLowerCase().includes('error sending confirmation')) {
        toast.error('Unable to send confirmation email. Please configure SMTP in your Supabase project (Auth → Settings → SMTP) and ensure redirect URLs include your site (e.g. http://localhost:8080 and your production domain).');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <Helmet><title>Sign up | QuickFlow</title><meta name="description" content="Create your QuickFlow account." /></Helmet>
      <div className="container py-16 grid place-items-center">
        <div className="w-full max-w-md rounded-xl border p-6">
          <h1 className="text-2xl font-semibold mb-4">Create account</h1>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="First name" className="rounded-md border bg-background px-3 py-2" value={firstName} onChange={e=>setFirstName(e.target.value)} />
              <input placeholder="Last name" className="rounded-md border bg-background px-3 py-2" value={lastName} onChange={e=>setLastName(e.target.value)} />
            </div>
            <input placeholder="Email" className="rounded-md border bg-background px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="rounded-md border bg-background px-3 py-2" value={password} onChange={e=>setPassword(e.target.value)} />
            <Button variant="hero" onClick={handleSignup} disabled={loading || !email || !password || !firstName}>{loading ? "Creating..." : "Create account"}</Button>
            <div className="text-sm">Have an account? <a className="text-primary underline-offset-4 hover:underline" href="/auth/login">Log in</a></div>
            <div className="text-sm text-yellow-600">Please check your email and confirm your address before continuing the onboarding.</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Signup;
