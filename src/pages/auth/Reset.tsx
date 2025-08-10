import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";

const Reset = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success("Password reset email sent");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <Helmet><title>Reset password | QuickFlow</title><meta name="description" content="Reset your QuickFlow password." /></Helmet>
      <div className="container py-16 grid place-items-center">
        <div className="w-full max-w-md rounded-xl border p-6 text-center">
          {sent ? (
            <>
              <h1 className="text-2xl font-semibold mb-2">Check your email</h1>
              <p className="text-muted-foreground">If an account exists, you'll receive a password reset link.</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold mb-4">Reset your password</h1>
              <div className="grid gap-3 text-left">
                <input placeholder="Email" className="rounded-md border bg-background px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} />
                <Button variant="hero" onClick={handleReset} disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Reset;
