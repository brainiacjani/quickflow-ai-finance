import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SUPPORT_EMAIL = "support@quickflow.app";

export default function Contact() {
  const { user } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const source = params.get("source") ?? undefined;
  const plan = params.get("plan") ?? undefined;

  const [name, setName] = useState(user?.user_metadata?.full_name ?? user?.email ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState<string>(
    `Hi,\n\nI'd like to discuss upgrading my plan${plan ? ` to ${plan}` : ""}.${source ? `\n\n(Visited from: ${source})` : ""}`
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // if user info becomes available later, prefill
    if (user) {
      setName((n) => n || (user.user_metadata?.full_name as string) || user.email || "");
      setEmail((e) => e || user.email || "");
    }
  }, [user]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !message) return toast.error("Please provide your email and a short message.");
    setLoading(true);
    try {
      // save to contacts table if available
      try {
        await supabase.from("contacts").insert([
          {
            name: name || null,
            email,
            message,
            source,
            plan,
          },
        ]);
      } catch (err) {
        console.debug("contacts insert failed", err);
      }

      // call Supabase Edge Function to send via the SMTP credentials configured in Supabase
      const payload = { name, email, message, source, plan };
      try {
        const fnRes: any = await supabase.functions.invoke('send-contact', { body: JSON.stringify(payload) });
        // supabase-js returns an object; assume success if no error and status 200
        if (!fnRes?.error) {
          toast.success("Message sent. We'll get back to you soon.");
          setMessage('');
          return;
        }
        console.debug('supabase function error', fnRes.error || fnRes);
      } catch (err) {
        console.debug('supabase function invoke failed', err);
      }

      // fallback to local server endpoint if function isn't available (dev)
      try {
        const res = await fetch("/api/send-contact", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          toast.success("Message sent via local helper. We'll get back to you soon.");
          setMessage('');
          return;
        }
        console.debug('send-contact response not ok', await res.text());
      } catch (err) {
        console.debug('send-contact failed', err);
      }

      // final fallback to mailto
      const subject = `QuickFlow contact${plan ? ` - ${plan}` : ""}`;
      const body = `${message}\n\n---\nName: ${name || "-"}\nEmail: ${email}\nSource: ${source || "-"}\nPlan: ${plan || "-"}`;
      const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      toast.success("Opening your email client to send the message. We also saved a copy.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to send contact message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <Helmet>
        <title>Contact us | QuickFlow</title>
      </Helmet>

      <div className="container py-16 grid place-items-center">
        <div className="w-full max-w-xl rounded-xl border p-6">
          <h1 className="text-2xl font-semibold mb-4">Contact sales</h1>
          <p className="text-sm text-muted-foreground mb-4">Fill the form below and we'll get back to you. Submitting will also open your email client so you can send the message directly to our team.</p>
          <form onSubmit={handleSubmit} className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs text-muted-foreground">Full name</span>
              <input className="rounded-md border bg-background px-3 py-2" value={name} onChange={e => setName(e.target.value)} />
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-muted-foreground">Email</span>
              <input type="email" className="rounded-md border bg-background px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} />
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-muted-foreground">Message</span>
              <textarea className="rounded-md border bg-background p-3 min-h-[120px]" value={message} onChange={e => setMessage(e.target.value)} />
            </label>

            <div className="flex items-center gap-2">
              <Button type="submit" variant="hero" disabled={loading}>{loading ? 'Sending...' : 'Send message'}</Button>
              <Button variant="ghost" onClick={() => { setMessage(''); }}>Clear</Button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
