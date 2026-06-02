import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/AppShell";
import { useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Receipt,
  Clock,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  BarChart3
} from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [localProfileName, setLocalProfileName] = useState<string | null>(null);

  // If onboarding just wrote the profile, useProfile() may not have returned yet.
  // Do a quick fallback fetch to pick up the user's first name and avoid showing the email prefix.
  useEffect(() => {
    if (!user || profile) return;
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('first_name,display_name')
          .eq('id', user.id)
          .maybeSingle();
        if (!mounted) return;
        setLocalProfileName(data?.first_name ?? data?.display_name ?? null);
      } catch (e) {
        console.error('profile fallback fetch failed', e);
      }
    })();
    return () => { mounted = false; };
  }, [user, profile]);

  const displayName =
    profile?.first_name
    ?? profile?.display_name
    /* full_name not present in generated types */
    ?? localProfileName
    ?? user?.user_metadata?.full_name
    ?? user?.user_metadata?.name
    ?? user?.user_metadata?.given_name
    ?? (user?.email ? user.email.split('@')[0] : '');

  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        const [invoicesData, expensesData] = await Promise.all([
          supabase.from('invoices').select('*'),
          supabase.from('expenses').select('*')
        ]);
        
        // Debug: log counts to help diagnose empty metrics
        console.debug('Dashboard: fetched invoices count', invoicesData?.data?.length ?? 0, 'expenses count', expensesData?.data?.length ?? 0);
        if (invoicesData.data) setInvoices(invoicesData.data);
        if (expensesData.data) setExpenses(expensesData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const invoicesChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices'
        },
        async () => {
          const { data } = await supabase.from('invoices').select('*');
          if (data) setInvoices(data);
        }
      )
      .subscribe();

    const expensesChannel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses'
        },
        async () => {
          const { data } = await supabase.from('expenses').select('*');
          if (data) setExpenses(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(invoicesChannel);
      supabase.removeChannel(expensesChannel);
    };
  }, [user]);
  
  const { chartData, metrics, recentActivity, expenseCategories } = useMemo(() => {
    if (loading) return {
      chartData: [],
      metrics: {
        currentRevenue: 0,
        currentExpenses: 0,
        currentProfit: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        avgMonthlyRevenue: 0,
        cashDays: 0,
        revenueTrend: 0,
        expenseTrend: 0,
        profitTrend: 0,
        invoiceCount: 0,
        overdueInvoices: 0,
        paidInvoices: 0
      },
      recentActivity: [],
      expenseCategories: []
    };
    
    // Build comprehensive dataset
    // Helper to robustly extract invoice issue date and total across varying field names
    const getInvoiceDate = (inv: any) => inv?.issueDate ?? inv?.issuedate ?? inv?.issuedAt ?? inv?.created_at ?? null;
    const getInvoiceTotal = (inv: any) => Number(inv?.total ?? inv?.amount ?? 0) || 0;
    
    const months = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return d;
    });

    const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()+1}`;
    
    const chartData = months.map((m) => {
      const mk = monthKey(m);
      const earned = invoices
        .filter((i: any) => i.status !== 'draft')
        .filter((i: any) => {
          const d = getInvoiceDate(i);
          return d ? monthKey(new Date(d)) === mk : false;
        })
        .reduce((s: number, i: any) => s + getInvoiceTotal(i), 0);
      const spent = expenses
        .filter((e: any) => monthKey(new Date(e.date)) === mk)
        .reduce((s: number, e: any) => s + Number(e.amount ?? 0), 0);
      return {
        name: m.toLocaleString(undefined, { month: 'short' }),
        earned,
        spent,
        profit: earned - spent
      };
    });

    const latest = chartData[chartData.length - 1] ?? { earned: 0, spent: 0, profit: 0 };
    const previous = chartData[chartData.length - 2] ?? { earned: 0, spent: 0, profit: 0 };
    
    const totalRevenue = chartData.reduce((sum, month) => sum + month.earned, 0);
    const totalExpenses = chartData.reduce((sum, month) => sum + month.spent, 0);
    const avgMonthlyRevenue = totalRevenue / 12;
    const cashDays = Math.max(30, Math.round(((latest.earned - latest.spent) + 5000) / (Math.max(latest.spent, 500) / 30)));

    // Calculate trends
    const revenueTrend = ((latest.earned - previous.earned) / Math.max(previous.earned, 1)) * 100;
    const expenseTrend = ((latest.spent - previous.spent) / Math.max(previous.spent, 1)) * 100;
    const profitTrend = ((latest.profit - previous.profit) / Math.max(Math.abs(previous.profit), 1)) * 100;

    // Recent activity from real data
    const recentActivity = [
      ...invoices.slice(-3).map(invoice => ({
        type: 'invoice',
        description: `Invoice to ${invoice.customer} - ${invoice.status}`,
        amount: getInvoiceTotal(invoice),
        time: new Date(invoice.created_at || getInvoiceDate(invoice) || Date.now()).toLocaleDateString(),
        status: invoice.status === 'paid' ? 'success' : invoice.status === 'sent' ? 'pending' : 'neutral'
      })),
      ...expenses.slice(-2).map(expense => ({
        type: 'expense',
        description: `${expense.vendor} - ${expense.category}`,
        amount: -Number(expense.amount),
        time: new Date(expense.created_at).toLocaleDateString(),
        status: 'neutral'
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

    // Expense categories from real data
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    const colors = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];
    const expenseCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => Number(b) - Number(a))
      .slice(0, 5)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index] || 'hsl(var(--muted))'
      }));

    return {
      chartData,
      metrics: {
        currentRevenue: latest.earned,
        currentExpenses: latest.spent,
        currentProfit: latest.profit,
        totalRevenue,
        totalExpenses,
        avgMonthlyRevenue,
        cashDays,
        revenueTrend,
        expenseTrend,
        profitTrend,
        invoiceCount: invoices.length,
        overdueInvoices: invoices.filter(i => {
          const dueDate = new Date(i.duedate);
          const today = new Date();
          return i.status === 'sent' && dueDate < today;
        }).length,
        paidInvoices: invoices.filter(i => i.status === 'paid').length
      },
      recentActivity,
      expenseCategories
    };
  }, [invoices, expenses, loading]);

  // Debug: log metrics and chartData whenever they update
  useEffect(() => {
    try {
      console.debug('Dashboard: chartData', chartData);
      console.debug('Dashboard: metrics', metrics);
    } catch (e) { /* ignore */ }
  }, [chartData, metrics]);

  // animate dashboard components on load (keeps layout, adds subtle fade/slide)
  const [animateDashboard, setAnimateDashboard] = useState(false);
  useEffect(() => {
    // trigger animation after data is ready
    if (loading) return;
    const t = window.setTimeout(() => setAnimateDashboard(true), 80);
    return () => window.clearTimeout(t);
  }, [loading]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Receipt className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendIcon = (trend: number) => {
    return trend >= 0 ? 
      <ArrowUpRight className="h-4 w-4 text-green-500" /> : 
      <ArrowDownRight className="h-4 w-4 text-red-500" />;
  };

  const metricCards = [
    {
      title: "Revenue",
      value: formatCurrency(metrics.currentRevenue),
      trend: metrics.revenueTrend,
      icon: DollarSign,
      tone: "text-emerald-700",
    },
    {
      title: "Expenses",
      value: formatCurrency(metrics.currentExpenses),
      trend: -metrics.expenseTrend,
      icon: Receipt,
      tone: "text-amber-700",
    },
    {
      title: "Net profit",
      value: formatCurrency(metrics.currentProfit),
      trend: metrics.profitTrend,
      icon: TrendingUp,
      tone: metrics.currentProfit >= 0 ? "text-emerald-700" : "text-rose-700",
    },
    {
      title: "Cash runway",
      value: `${metrics.cashDays} days`,
      helper: "At the current spend rate",
      icon: Target,
      tone: "text-sky-700",
    },
  ];

  return (
    <AppShell>
      <Helmet>
        <title>Dashboard | QuickFlow</title>
        <meta name="description" content="Interactive business dashboard with real-time insights, analytics, and financial tracking." />
        <link rel="canonical" href="https://quickflow.app/dashboard" />
      </Helmet>
      
      {loading ? (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-72 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-80 lg:col-span-2 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-64 lg:col-span-2 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      ) : (
      <div className={`space-y-8 ${animateDashboard ? 'opacity-100' : 'opacity-0'} transition-all duration-700 ease-out` }>
        {/* Header */}
        <div className={`panel-surface grid-muted relative overflow-hidden px-6 py-6 sm:px-8 sm:py-7 ${animateDashboard ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'} transition-all duration-700 delay-75`}>
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,_rgba(33,121,103,0.18),_transparent_55%)] lg:block" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                Daily overview
              </Badge>
              <h1 className="text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                Welcome back{displayName ? `, ${displayName}` : ''}.
              </h1>
              <p className="mt-2 max-w-xl text-base text-muted-foreground">
                A clean view of revenue, spending, and what needs attention today.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full border-border/80 bg-card/80 px-3 py-1.5 text-sm text-foreground/80">
                {metrics.invoiceCount} invoices tracked
              </Badge>
              <Badge variant="outline" className="rounded-full border-border/80 bg-card/80 px-3 py-1.5 text-sm text-foreground/80">
                {formatCurrency(metrics.totalRevenue)} trailing revenue
              </Badge>
            </div>
          </div>
          <div className="relative mt-5 flex gap-2">
            <Link to="/invoices">
              <Button variant="outline" size="sm" className="gap-2 border-border/80 bg-card/85 shadow-sm">
                <PlusCircle className="h-4 w-4" />
                New Invoice
              </Button>
            </Link>
            <Link to="/expenses">
              <Button variant="default" size="sm" className="gap-2">
                <Receipt className="h-4 w-4" />
                Add Expense
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card, index) => {
            const Icon = card.icon;
            const isTrendPositive = (card.trend ?? 0) >= 0;

            return (
              <div key={card.title} className={`panel-surface px-5 py-5 ${animateDashboard ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'} transition-all duration-700`} style={{ transitionDelay: `${150 + index * 50}ms` }}>
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-foreground/75">{card.title}</div>
                    <div className={`mt-2 text-3xl font-bold tracking-tight ${card.tone}`}>{card.value}</div>
                  </div>
                  <div className="rounded-2xl bg-secondary/75 p-3 text-foreground/70">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                {typeof card.trend === 'number' ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getTrendIcon(card.trend)}
                    <span className={isTrendPositive ? 'text-emerald-700' : 'text-rose-700'}>
                      {Math.abs(card.trend).toFixed(1)}% from last month
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{card.helper}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue vs Expenses Chart */}
          <div className="panel-surface lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Revenue & Expenses Trend</div>
                  <div className="text-xs text-muted-foreground">Monthly comparison over the last 12 months</div>
                </div>
              </div>
              <Link to="/reports">
                <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-secondary">
                  <BarChart3 className="h-4 w-4" />
                  View Reports
                </Button>
              </Link>
            </div>
            <div className="px-5 py-5">
               <div className="h-80">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
                    <defs>
                      <linearGradient id="earned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="spent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.7}/>
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-soft)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="earned" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#earned)"
                      name="Revenue"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="spent" 
                      stroke="hsl(var(--destructive))" 
                      fillOpacity={1} 
                      fill="url(#spent)"
                      name="Expenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Expense Categories */}
          <div className="panel-surface">
            <div className="border-b border-border/70 px-5 py-4">
              <div className="text-sm font-semibold">Expense Categories</div>
              <div className="text-xs text-muted-foreground">Breakdown by category this month</div>
            </div>
            <div className="px-5 py-5">
               <div className="h-64">
                 {expenseCategories.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                      <Pie
                        data={expenseCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={96}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {expenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '16px', boxShadow: 'var(--shadow-soft)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                 ) : (
                  <div className="grid h-full place-items-center rounded-[calc(var(--radius)-0.125rem)] bg-secondary/45 text-center text-sm text-muted-foreground">
                    Add a few expenses to see category mix.
                  </div>
                 )}
              </div>
              <div className="space-y-2 mt-4">
                {expenseCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(category.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Quick Stats */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <div className="panel-surface lg:col-span-2">
            <div className="border-b border-border/70 px-5 py-4">
              <div className="text-sm font-semibold">Recent Activity</div>
              <div className="text-xs text-muted-foreground">Latest transactions and updates</div>
            </div>
            <div className="px-5 py-5">
               <div className="space-y-4">
                {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between rounded-[calc(var(--radius)-0.125rem)] border border-border/70 bg-card/70 p-3 transition-colors hover:bg-secondary/40">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-secondary/70 p-2">
                        {getStatusIcon(activity.status)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                    <div className={`font-medium ${activity.amount > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {activity.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(activity.amount))}
                    </div>
                  </div>
                )) : (
                  <div className="grid h-44 place-items-center rounded-[calc(var(--radius)-0.125rem)] bg-secondary/45 text-center text-sm text-muted-foreground">
                    Activity will appear here once invoices and expenses start moving.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="panel-surface">
            <div className="border-b border-border/70 px-5 py-4">
              <div className="text-sm font-semibold">Quick Stats</div>
              <div className="text-xs text-muted-foreground">Key business metrics</div>
            </div>
            <div className="px-5 py-5 space-y-6">
               <div className="space-y-2">
                 <div className="flex justify-between items-center">
                   <span className="text-sm text-muted-foreground">Total Invoices</span>
                   <Badge variant="secondary" className="rounded-full px-3 py-1">{metrics.invoiceCount}</Badge>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-sm text-muted-foreground">Paid Invoices</span>
                   <Badge variant="default" className="rounded-full px-3 py-1">{metrics.paidInvoices}</Badge>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-sm text-muted-foreground">Overdue</span>
                   <Badge variant="destructive" className="rounded-full px-3 py-1">{metrics.overdueInvoices}</Badge>
                 </div>
               </div>
               
              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Monthly Revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(metrics.avgMonthlyRevenue)}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Link to="/invoices" className="w-full">
                  <Button className="w-full gap-2">
                    <FileText className="h-4 w-4" />
                    Create Invoice
                  </Button>
                </Link>
              </div>
            </div>
          </div>
         </div>
       </div>
       )}
     </AppShell>
   );
 };
 
 export default Dashboard;
