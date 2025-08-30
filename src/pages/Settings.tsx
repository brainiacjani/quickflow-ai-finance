import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { useProfile } from "@/hooks/useProfile";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { data: company, refetch: refetchCompany } = useCompany();

  // Local state for forms
  const [pFirst, setPFirst] = useState("");
  const [pLast, setPLast] = useState("");
  const [pDisplay, setPDisplay] = useState("");

  const [cName, setCName] = useState("");
  const [cType, setCType] = useState("");
  const [cRegion, setCRegion] = useState("");
  const [cCurrency, setCCurrency] = useState("");
  const [cStart, setCStart] = useState("");
  const [cLogoUrl, setCLogoUrl] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  useEffect(() => {
    if (profile) {
      setPFirst(profile.first_name || "");
      setPLast(profile.last_name || "");
      setPDisplay(profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim());
    }
  }, [profile]);

  useEffect(() => {
    if (company) {
      setCName(company.name || "");
      setCType(company.business_type || "");
      setCRegion(company.region || "");
      setCCurrency(company.currency || "");
      setCStart(company.fiscal_year_start || "");
      setCLogoUrl((company as any)?.logo_url || "");
    }
  }, [company]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: pFirst || null,
          last_name: pLast || null,
          display_name: (pDisplay || [pFirst, pLast].filter(Boolean).join(" ").trim()) || null,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated");
      refetchProfile();
    } catch (err: any) {
      console.error("Save profile failed", err);
      toast.error(err?.message ?? "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveCompany = async () => {
    if (!user) return;
    if (!cName.trim()) {
      toast.error("Company name is required");
      return;
    }
    setSavingCompany(true);
    try {
      const payload = {
        owner_id: user.id,
        name: cName,
        business_type: cType || null,
        region: cRegion || null,
        currency: cCurrency || null,
        fiscal_year_start: cStart || null,
        logo_url: cLogoUrl || null,
      } as any;
      const { error } = await supabase.from("companies").upsert(payload, { onConflict: "owner_id" });
      if (error) throw error;
      toast.success("Company updated");
      refetchCompany();
    } catch (err: any) {
      console.error("Save company failed", err);
      toast.error(err?.message ?? "Failed to update company");
    } finally {
      setSavingCompany(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!user || !file) return;
    try {
      setUploadingLogo(true);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${user.id}/company-logo-${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from('company-logos')
        .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: pub } = supabase.storage.from('company-logos').getPublicUrl(data.path);
      setCLogoUrl(pub.publicUrl);
      toast.success('Logo uploaded');
    } catch (err: any) {
      console.error('Logo upload failed', err);
      toast.error(err?.message ?? 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <AppShell>
      <Helmet>
        <title>Settings | QuickFlow</title>
        <meta name="description" content="Manage your QuickFlow account and integrations." />
      </Helmet>

      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl w-full mx-auto grid gap-8">
          <section className="grid gap-3">
            <h1 className="text-2xl font-semibold">Account</h1>
            <div className="rounded-lg border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
              <div className="flex-1 min-w-0">
                <div className="font-medium">{pDisplay || [pFirst, pLast].filter(Boolean).join(" ").trim() || user?.email || "Account"}</div>
                <div className="text-sm text-muted-foreground">Signed in as {user?.email}</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={() => navigate("/auth/update-password")} className="w-full sm:w-auto">Change password</Button>
                <Button variant="outline" onClick={signOut} className="w-full sm:w-auto">Log out</Button>
              </div>
            </div>
          </section>

          <section className="grid gap-3">
            <h2 className="text-xl font-semibold">Personal info</h2>
            <div className="rounded-lg border p-4 grid gap-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <label className="text-sm">First name</label>
                  <input className="rounded-md border bg-background px-3 py-2 w-full" value={pFirst} onChange={(e) => setPFirst(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Last name</label>
                  <input className="rounded-md border bg-background px-3 py-2 w-full" value={pLast} onChange={(e) => setPLast(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-1">
                <label className="text-sm">Display name</label>
                <input className="rounded-md border bg-background px-3 py-2 w-full" value={pDisplay} onChange={(e) => setPDisplay(e.target.value)} placeholder="Shown in the app" />
              </div>

              <div className="flex justify-end">
                <Button variant="hero" onClick={saveProfile} disabled={savingProfile} className="w-full sm:w-auto">
                  {savingProfile ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          </section>

          <section className="grid gap-3">
            <h2 className="text-xl font-semibold">Company</h2>
            <div className="rounded-lg border p-4 grid gap-3">
              <div className="grid gap-1">
                <label className="text-sm">Company name</label>
                <input className="rounded-md border bg-background px-3 py-2 w-full" value={cName} onChange={(e) => setCName(e.target.value)} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <label className="text-sm">Business type</label>
                  <input className="rounded-md border bg-background px-3 py-2 w-full" value={cType} onChange={(e) => setCType(e.target.value)} placeholder="Freelancer / Retail / SaaS..." />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Country/State</label>
                  <input className="rounded-md border bg-background px-3 py-2 w-full" value={cRegion} onChange={(e) => setCRegion(e.target.value)} placeholder="US / CA / EU..." />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <label className="text-sm">Currency</label>
                  <input className="rounded-md border bg-background px-3 py-2 w-full" value={cCurrency} onChange={(e) => setCCurrency(e.target.value)} placeholder="USD" />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Fiscal year start date</label>
                  <input type="date" className="rounded-md border bg-background px-3 py-2 w-full" value={cStart || ""} onChange={(e) => setCStart(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm">Company logo</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {cLogoUrl ? (
                    <img src={cLogoUrl} alt={`${cName || 'Company'} logo`} className="h-12 w-12 rounded-md border object-cover" loading="lazy" />
                  ) : (
                    <div className="h-12 w-12 rounded-md border grid place-items-center text-xs text-muted-foreground">No logo</div>
                  )}
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                      disabled={uploadingLogo}
                    />
                    <p className="text-xs text-muted-foreground">Recommended: Square PNG or SVG, at least 128x128.</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="hero" onClick={saveCompany} disabled={savingCompany} className="w-full sm:w-auto">
                  {savingCompany ? "Saving..." : "Save changes"}
                </Button>
              </div>
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
      </div>
    </AppShell>
  );
};

export default Settings;
