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
import useTheme from '@/hooks/useTheme';

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { data: company, refetch: refetchCompany } = useCompany();
  const themeHook = useTheme();
  const [themePref, setThemePref] = useState<'system' | 'light' | 'dark'>('system');

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
      // initialize theme from profile if present
      if ((profile as any)?.theme) {
        const t = (profile as any).theme as 'system' | 'light' | 'dark';
        setThemePref(t);
        // update client theme hook to reflect saved pref
        themeHook.setPreference?.(t);
      }
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

      <div className="max-w-full py-8">
        <div className="mx-auto grid w-full max-w-4xl gap-8">
          <section className="panel-surface grid-muted relative overflow-hidden rounded-[2rem] px-6 py-6 sm:px-8 sm:py-7">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.12),transparent_55%)] lg:block" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Workspace preferences
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Settings</h1>
                <p className="mt-2 max-w-xl text-base text-muted-foreground">
                  Manage your account, company identity, appearance, and future integrations from one consistent workspace surface.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-sm text-foreground/80">{pDisplay || user?.email || "Account"}</div>
                <div className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-sm text-foreground/80">{cName || "No company set"}</div>
              </div>
            </div>
          </section>

          <section className="grid gap-3">
            <h2 className="font-display text-xl font-semibold tracking-tight">Account</h2>
            <div className="panel-surface flex w-full flex-col items-start justify-between gap-4 rounded-[1.75rem] p-5 sm:flex-row sm:items-center sm:p-6">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{pDisplay || [pFirst, pLast].filter(Boolean).join(" ").trim() || user?.email || "Account"}</div>
                <div className="text-sm text-muted-foreground">Signed in as {user?.email}</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={() => navigate("/auth/update-password")} className="w-full rounded-full sm:w-auto">Change password</Button>
                <Button variant="outline" onClick={signOut} className="w-full rounded-full sm:w-auto">Log out</Button>
              </div>
            </div>
          </section>

          <section className="grid gap-3">
            <h2 className="font-display text-xl font-semibold tracking-tight">Personal info</h2>
            <div className="panel-surface grid gap-4 rounded-[1.75rem] p-5 sm:p-6">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">First name</label>
                  <input className="w-full rounded-2xl border border-border/80 bg-card px-4 py-3" value={pFirst} onChange={(e) => setPFirst(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Last name</label>
                  <input className="w-full rounded-2xl border border-border/80 bg-card px-4 py-3" value={pLast} onChange={(e) => setPLast(e.target.value)} />
                </div>
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Display name</label>
                <input className="w-full rounded-2xl border border-border/80 bg-card px-4 py-3" value={pDisplay} onChange={(e) => setPDisplay(e.target.value)} placeholder="Shown in the app" />
              </div>

              <div className="flex justify-end">
                <Button variant="hero" onClick={saveProfile} disabled={savingProfile} className="w-full rounded-full sm:w-auto">
                  {savingProfile ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          </section>

          <section className="grid gap-3">
            <h2 className="font-display text-xl font-semibold tracking-tight">Company</h2>
            <div className="panel-surface grid gap-4 rounded-[1.75rem] p-5 sm:p-6">
              <div className="grid gap-1">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Company name</label>
                <input className="w-full rounded-2xl border border-border/80 bg-card px-4 py-3" value={cName} onChange={(e) => setCName(e.target.value)} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Business type</label>
                  <input className="w-full rounded-2xl border border-border/80 bg-card px-4 py-3" value={cType} onChange={(e) => setCType(e.target.value)} placeholder="Freelancer / Retail / SaaS..." />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Country/State</label>
                  <input className="w-full rounded-2xl border border-border/80 bg-card px-4 py-3" value={cRegion} onChange={(e) => setCRegion(e.target.value)} placeholder="US / CA / EU..." />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Currency</label>
                  <input className="w-full rounded-2xl border border-border/80 bg-card px-4 py-3" value={cCurrency} onChange={(e) => setCCurrency(e.target.value)} placeholder="USD" />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Fiscal year start date</label>
                  <input type="date" className="w-full rounded-2xl border border-border/80 bg-card px-4 py-3" value={cStart || ""} onChange={(e) => setCStart(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Company logo</label>
                <div className="flex flex-col items-start gap-4 rounded-[1.5rem] bg-secondary/35 p-4 sm:flex-row sm:items-center">
                  {cLogoUrl ? (
                    <img src={cLogoUrl} alt={`${cName || 'Company'} logo`} className="h-14 w-14 rounded-2xl border border-border/80 object-cover" loading="lazy" />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-2xl border border-border/80 text-xs text-muted-foreground">No logo</div>
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
                <Button variant="hero" onClick={saveCompany} disabled={savingCompany} className="w-full rounded-full sm:w-auto">
                  {savingCompany ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          </section>
          
          <section className="grid gap-3">
            <h2 className="font-display text-xl font-semibold tracking-tight">Appearance</h2>
            <div className="panel-surface grid gap-4 rounded-[1.75rem] p-5 sm:p-6">
              <div className="text-sm text-muted-foreground">Choose how QuickFlow should render colors for your account. This preference is saved to your profile.</div>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`rounded-full border px-4 py-2 text-sm transition ${themePref === 'system' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/80 hover:bg-secondary/35'}`}
                  onClick={() => { setThemePref('system'); themeHook.setPreference?.('system'); }}
                >System</button>
                <button
                  className={`rounded-full border px-4 py-2 text-sm transition ${themePref === 'light' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/80 hover:bg-secondary/35'}`}
                  onClick={() => { setThemePref('light'); themeHook.setPreference?.('light'); }}
                >Light</button>
                <button
                  className={`rounded-full border px-4 py-2 text-sm transition ${themePref === 'dark' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/80 hover:bg-secondary/35'}`}
                  onClick={() => { setThemePref('dark'); themeHook.setPreference?.('dark'); }}
                >Dark</button>
              </div>
              <div className="flex justify-end">
                <Button
                  className="rounded-full"
                  variant="hero"
                  onClick={async () => {
                    if (!user) return;
                    try {
                      const { error } = await supabase.from('profiles').update({ theme: themePref }).eq('id', user.id);
                      if (error) throw error;
                      toast.success('Theme preference saved');
                      refetchProfile();
                    } catch (err: any) {
                      console.error('Save theme failed', err);
                      toast.error('Failed to save theme');
                    }
                  }}
                >Save appearance</Button>
              </div>
            </div>
          </section>

          <section className="grid gap-3">
            <h2 className="font-display text-xl font-semibold tracking-tight">Integrations</h2>
            <div className="panel-surface grid gap-4 rounded-[1.75rem] p-5 sm:p-6">
              <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-4">
                <div className="font-medium text-foreground">Stripe (Payments)</div>
                <div className="text-sm text-muted-foreground">Enable Stripe Checkout to accept card/ACH. Configure your Stripe secret key in the backend when ready.</div>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-4">
                <div className="font-medium text-foreground">AWS S3 (Receipts)</div>
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
