import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/AppShell";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { listExpenses, listInvoices } from "@/store/demoData";

const Dashboard = () => {
  const { user } = useAuth();
  const data = useMemo(() => {
    // Build simple dataset from local entries (by month)
    const months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d;
    });

    const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()+1}`;

    const inv = listInvoices();
    const exp = listExpenses();
    return months.map((m) => {
      const mk = monthKey(m);
      const earned = inv
        .filter(i => i.status !== 'draft')
        .filter(i => monthKey(new Date(i.issueDate)) === mk)
        .reduce((s, i) => s + i.total, 0);
      const spent = exp
        .filter(e => monthKey(new Date(e.date)) === mk)
        .reduce((s, e) => s + e.amount, 0);
      return {
        name: m.toLocaleString(undefined, { month: 'short' }),
        earned,
        spent,
      };
    });
  }, [user]);

  const latest = data[data.length - 1] ?? { earned: 0, spent: 0 };
  const cashDays = Math.max(30, Math.round(((latest.earned - latest.spent) + 5000) / (Math.max(latest.spent, 500) / 30)));

  return (
    <AppShell>
      <Helmet>
        <title>Dashboard | QuickFlow</title>
        <meta name="description" content="Plain-English cashflow dashboard with income and expenses at a glance." />
        <link rel="canonical" href="https://quickflow.app/dashboard" />
      </Helmet>
      <div className="container py-8 space-y-8">
        <h1 className="text-2xl font-semibold">Welcome back{user?.email ? `, ${user.email}` : ''} 👋</h1>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">You earned this month</div>
            <div className="text-2xl font-bold">${latest.earned.toFixed(2)}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">You spent on vendors</div>
            <div className="text-2xl font-bold">${latest.spent.toFixed(2)}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Cash runway</div>
            <div className="text-2xl font-bold">{cashDays} days</div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between pb-4">
            <h2 className="font-semibold">Cashflow</h2>
            <a href="/reports"><Button variant="ghost" size="sm">View reports</Button></a>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="earned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`hsl(var(--brand))`} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={`hsl(var(--brand))`} stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="spent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`hsl(var(--destructive))`} stopOpacity={0.7}/>
                    <stop offset="95%" stopColor={`hsl(var(--destructive))`} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="earned" stroke={`hsl(var(--brand))`} fillOpacity={1} fill="url(#earned)" />
                <Area type="monotone" dataKey="spent" stroke={`hsl(var(--destructive))`} fillOpacity={1} fill="url(#spent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
