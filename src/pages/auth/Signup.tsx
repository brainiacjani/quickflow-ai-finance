import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const Signup = () => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <AppShell>
      <Helmet><title>Sign up | QuickFlow</title><meta name="description" content="Create your QuickFlow account." /></Helmet>
      <div className="container py-16 grid place-items-center">
        <div className="w-full max-w-md rounded-xl border p-6">
          <h1 className="text-2xl font-semibold mb-4">Create account</h1>
          <div className="grid gap-3">
            <input placeholder="Email" className="rounded-md border bg-background px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} />
            <input type="password" placeholder="Password" className="rounded-md border bg-background px-3 py-2" value={password} onChange={e=>setPassword(e.target.value)} />
            <Button variant="hero" onClick={() => signUp(email, password).then(()=> window.location.href='/onboarding')}>Create account</Button>
            <div className="text-sm">Have an account? <a className="text-primary underline-offset-4 hover:underline" href="/auth/login">Log in</a></div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Signup;
