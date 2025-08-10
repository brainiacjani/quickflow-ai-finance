import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const UpdatePassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async () => {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <Helmet>
        <title>Update password | QuickFlow</title>
        <meta name="description" content="Set a new password for your QuickFlow account." />
        <link rel="canonical" href={`${window.location.origin}/auth/update-password`} />
      </Helmet>
      <div className="container py-16 grid place-items-center">
        <div className="w-full max-w-md rounded-xl border p-6">
          <h1 className="text-2xl font-semibold mb-4">Set a new password</h1>
          <div className="grid gap-3">
            <input type="password" placeholder="New password" className="rounded-md border bg-background px-3 py-2" value={password} onChange={e=>setPassword(e.target.value)} />
            <input type="password" placeholder="Confirm new password" className="rounded-md border bg-background px-3 py-2" value={confirm} onChange={e=>setConfirm(e.target.value)} />
            <Button variant="hero" onClick={handleUpdate} disabled={loading}>{loading ? "Updating..." : "Update password"}</Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default UpdatePassword;
