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
  const [showConfirmationCard, setShowConfirmationCard] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, { first_name: firstName, last_name: lastName });
      // mark unconfirmed email so AppShell can show a persistent top-bar reminder
      try { localStorage.setItem('qf_unconfirmed_email', email); } catch (e) { /* ignore */ }
      setShowConfirmationCard(true);
      toast.success("Account created — confirmation email sent.");
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

  const handleContinueToOnboarding = () => {
    navigate('/onboarding');
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
          </div>

          {/* Confirmation card shown after successful sign-up */}
          {showConfirmationCard && (
            <div className="mt-6">
              <div className="max-w-md">
                <div className="rounded-xl border bg-white p-4 shadow-md">
                  <h3 className="text-lg font-semibold">Check your email</h3>
                  <p className="text-sm text-muted-foreground mt-2">We've sent a confirmation email to <strong>{email}</strong>. Please confirm your email address to activate your account.</p>
                  <div className="mt-4 flex items-center gap-2">
                    <Button variant="hero" onClick={handleContinueToOnboarding}>Continue to onboarding</Button>
                    <Button variant="outline" onClick={() => { try { navigator.clipboard.writeText(email); } catch {} }}>Copy email</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Signup;
