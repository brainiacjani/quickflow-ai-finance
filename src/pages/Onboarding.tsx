
import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Onboarding = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>({
    first_name: "",
    last_name: "",
    company: "",
    type: "",
    region: "",
    currency: "USD",
    start: new Date().toISOString().slice(0, 10),
  });
  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const complete = async () => {
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }
    if (!data.company?.trim()) {
      toast.error("Please enter your company name");
      setStep(1);
      return;
    }
    setSaving(true);
    console.log("Onboarding complete payload", data);
    try {
      // Save profile (first/last/display_name)
      const display_name = [data.first_name, data.last_name].filter(Boolean).join(" ").trim() || null;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          display_name,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Upsert company for this owner
      const { error: companyError } = await supabase
        .from("companies")
        .upsert(
          {
            owner_id: user.id,
            name: data.company,
            business_type: data.type || null,
            region: data.region || null,
            currency: data.currency || null,
            fiscal_year_start: data.start || null,
          },
          { onConflict: "owner_id" }
        );

      if (companyError) throw companyError;

      localStorage.setItem("qf_onboarding", JSON.stringify(data));
      toast.success("You're all set!");
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Onboarding save failed", err);
      toast.error(err?.message ?? "Failed to save your setup");
    } finally {
      setSaving(false);
    }
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
            <label className="text-sm">First name</label>
            <input
              className="rounded-md border bg-background px-3 py-2"
              value={data.first_name}
              onChange={(e) => setData({ ...data, first_name: e.target.value })}
              placeholder="Jane"
            />
            <label className="text-sm">Last name</label>
            <input
              className="rounded-md border bg-background px-3 py-2"
              value={data.last_name}
              onChange={(e) => setData({ ...data, last_name: e.target.value })}
              placeholder="Doe"
            />
            <label className="text-sm">Company name</label>
            <input
              className="rounded-md border bg-background px-3 py-2"
              value={data.company}
              onChange={(e) => setData({ ...data, company: e.target.value })}
              placeholder="Acme LLC"
            />
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-3">
            <label className="text-sm">Business type</label>
            <input
              className="rounded-md border bg-background px-3 py-2"
              value={data.type}
              onChange={(e) => setData({ ...data, type: e.target.value })}
              placeholder="Freelancer / Retail / SaaS..."
            />
          </div>
        )}
        {step === 3 && (
          <div className="grid gap-3">
            <label className="text-sm">Country/State</label>
            <input
              className="rounded-md border bg-background px-3 py-2"
              value={data.region}
              onChange={(e) => setData({ ...data, region: e.target.value })}
              placeholder="US / CA / EU..."
            />
          </div>
        )}
        {step === 4 && (
          <div className="grid gap-3">
            <label className="text-sm">Currency</label>
            <input
              className="rounded-md border bg-background px-3 py-2"
              value={data.currency}
              onChange={(e) => setData({ ...data, currency: e.target.value })}
              placeholder="USD"
            />
          </div>
        )}
        {step === 5 && (
          <div className="grid gap-3">
            <label className="text-sm">Fiscal year start date</label>
            <input
              type="date"
              className="rounded-md border bg-background px-3 py-2"
              value={data.start}
              onChange={(e) => setData({ ...data, start: e.target.value })}
            />
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <Button variant="outline" onClick={prev} disabled={step === 1 || saving}>
            Back
          </Button>
          {step < 5 ? (
            <Button variant="hero" onClick={next} disabled={saving}>
              Continue
            </Button>
          ) : (
            <Button variant="hero" onClick={complete} disabled={saving}>
              {saving ? "Finishing..." : "Finish"}
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Onboarding;
