import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<any>({ company: '', type: '', region: '', currency: 'USD', start: new Date().toISOString().slice(0,10) });
  const next = () => setStep(s => Math.min(5, s+1));
  const prev = () => setStep(s => Math.max(1, s-1));

  const complete = () => {
    localStorage.setItem('qf_onboarding', JSON.stringify(data));
    window.location.href = '/dashboard';
  };

  return (
    <AppShell>
      <Helmet>
        <title>Onboarding | QuickFlow</title>
        <meta name="description" content="Get set up in minutes with QuickFlow's onboarding wizard." />
        <link rel="canonical" href="https://quickflow.app/onboarding" />
      </Helmet>
      <div className="container py-10 max-w-2xl">
        <div className="mb-6">
          <div className="text-sm text-muted-foreground">Step {step} of 5</div>
          <h1 className="text-2xl font-semibold">Let’s set up your business</h1>
        </div>

        {step === 1 && (
          <div className="grid gap-3">
            <label className="text-sm">Company name</label>
            <input className="rounded-md border bg-background px-3 py-2" value={data.company} onChange={e=>setData({ ...data, company: e.target.value })} placeholder="Acme LLC" />
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-3">
            <label className="text-sm">Business type</label>
            <input className="rounded-md border bg-background px-3 py-2" value={data.type} onChange={e=>setData({ ...data, type: e.target.value })} placeholder="Freelancer / Retail / SaaS..." />
          </div>
        )}
        {step === 3 && (
          <div className="grid gap-3">
            <label className="text-sm">Country/State</label>
            <input className="rounded-md border bg-background px-3 py-2" value={data.region} onChange={e=>setData({ ...data, region: e.target.value })} placeholder="US / CA / EU..." />
          </div>
        )}
        {step === 4 && (
          <div className="grid gap-3">
            <label className="text-sm">Currency</label>
            <input className="rounded-md border bg-background px-3 py-2" value={data.currency} onChange={e=>setData({ ...data, currency: e.target.value })} placeholder="USD" />
          </div>
        )}
        {step === 5 && (
          <div className="grid gap-3">
            <label className="text-sm">Fiscal year start date</label>
            <input type="date" className="rounded-md border bg-background px-3 py-2" value={data.start} onChange={e=>setData({ ...data, start: e.target.value })} />
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <Button variant="outline" onClick={prev} disabled={step===1}>Back</Button>
          {step < 5 ? (
            <Button variant="hero" onClick={next}>Continue</Button>
          ) : (
            <Button variant="hero" onClick={complete}>Finish</Button>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Onboarding;
