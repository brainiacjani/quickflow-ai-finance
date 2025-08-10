import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";

const Landing = () => {
  return (
    <AppShell>
      <Helmet>
        <title>QuickFlow — Simple AI Accounting & Invoicing</title>
        <meta name="description" content="QuickFlow helps small businesses and freelancers manage invoicing and expenses with AI—simple, affordable, and mobile-friendly." />
        <link rel="canonical" href="https://quickflow.app/" />
      </Helmet>
      <section className="relative overflow-hidden">
        <div className="container py-16 lg:py-24 grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Accounting made human. Invoices that get paid.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              QuickFlow is the AI‑powered accounting and invoicing app thats
              friendly, fast, and affordable.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/onboarding"><Button variant="hero" size="xl">Start your 14‑day free trial</Button></a>
              <a href="/pricing"><Button variant="secondary" size="xl">See pricing</Button></a>
            </div>
            <ul className="grid sm:grid-cols-3 gap-3 pt-4 text-sm">
              <li className="rounded-md border p-3">AI receipt scan</li>
              <li className="rounded-md border p-3">Stripe payments</li>
              <li className="rounded-md border p-3">Plain‑English dashboards</li>
            </ul>
          </div>
          <div className="relative">
            <div className="rounded-xl border bg-card shadow-[var(--shadow-elegant)] p-6 animate-float">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">You earned this month</span>
                  <span className="font-semibold">$4,230</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">You spent on vendors</span>
                  <span className="font-semibold">$1,890</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cash runway</span>
                  <span className="font-semibold">72 days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default Landing;
