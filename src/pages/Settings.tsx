import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Settings = () => {
  const { user, signOut } = useAuth();
  return (
    <AppShell>
      <Helmet><title>Settings | QuickFlow</title><meta name="description" content="Manage your QuickFlow account and integrations." /></Helmet>
      <div className="container py-8 grid gap-8 max-w-3xl">
        <section className="grid gap-3">
          <h1 className="text-2xl font-semibold">Account</h1>
          <div className="rounded-lg border p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{user?.email ?? 'Local user'}</div>
              <div className="text-sm text-muted-foreground">Signed in</div>
            </div>
            <Button variant="outline" onClick={signOut}>Log out</Button>
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="text-xl font-semibold">Integrations</h2>
          <div className="rounded-lg border p-4 grid gap-4">
            <div>
              <div className="font-medium">Stripe (Payments)</div>
              <div className="text-sm text-muted-foreground">Enable Stripe Checkout to accept card/ACH. Configure your Stripe secret key in the backend when ready.</div>
            </div>
            <div>
              <div className="font-medium">AWS S3 (Receipts)</div>
              <div className="text-sm text-muted-foreground">Connect S3 to store receipts securely. Configure credentials in the backend when ready.</div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Settings;
