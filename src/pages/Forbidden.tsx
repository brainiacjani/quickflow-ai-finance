import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

type ForbiddenProps = {
  title?: string;
  message?: string;
};

export default function Forbidden({ title = '403 — Forbidden', message = 'You do not have permission to access this page.' }: ForbiddenProps) {
  const { user } = useAuth();

  return (
    <AppShell>
      <Helmet>
        <title>{title} · QuickFlow</title>
      </Helmet>

      <div className="container py-28">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center p-8">
            <CardHeader>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription>{message}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-6 space-y-4">
                <p className="text-muted-foreground">If you believe this is an error, contact support or request access from your account administrator.</p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                  {user ? (
                    <>
                      <Link to="/dashboard">
                        <Button>Back to Dashboard</Button>
                      </Link>
                      <a href="mailto:support@quickflow.app">
                        <Button variant="outline">Contact Support</Button>
                      </a>
                    </>
                  ) : (
                    <>
                      <Link to="/auth/login">
                        <Button>Sign In</Button>
                      </Link>
                      <Link to="/auth/signup">
                        <Button variant="outline">Create Account</Button>
                      </Link>
                    </>
                  )}
                </div>

              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
