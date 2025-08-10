import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";

const Reset = () => {
  return (
    <AppShell>
      <Helmet><title>Reset password | QuickFlow</title><meta name="description" content="Reset your QuickFlow password." /></Helmet>
      <div className="container py-16 grid place-items-center">
        <div className="w-full max-w-md rounded-xl border p-6 text-center">
          <h1 className="text-2xl font-semibold mb-2">Check your email</h1>
          <p className="text-muted-foreground">If an account exists, youll receive a password reset link.</p>
        </div>
      </div>
    </AppShell>
  );
};

export default Reset;
