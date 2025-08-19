import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  TrendingDown, 
  DollarSign, 
  Calendar, 
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

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const displayName = profile?.first_name ?? profile?.display_name ?? (user?.email ? user.email.split('@')[0] : '');
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
    const months = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return d;
    });

    const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()+1}`;
    
    const chartData = months.map((m) => {
      const mk = monthKey(m);
      const earned = invoices
        .filter(i => i.status !== 'draft')
        .filter(i => monthKey(new Date(i.issuedate)) === mk)
        .reduce((s, i) => s + Number(i.total), 0);
      const spent = expenses
        .filter(e => monthKey(new Date(e.date)) === mk)
        .reduce((s, e) => s + Number(e.amount), 0);
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
        amount: Number(invoice.total),
        time: new Date(invoice.created_at).toLocaleDateString(),
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
      .sort(([,a], [,b]) => b - a)
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
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Welcome back{displayName ? `, ${displayName}` : ''}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">Here's what's happening with your business today.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/invoices">
              <Button variant="outline" size="sm" className="gap-2">
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.currentRevenue.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(metrics.revenueTrend)}
                <span className={metrics.revenueTrend >= 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(metrics.revenueTrend).toFixed(1)}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.currentExpenses.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(-metrics.expenseTrend)}
                <span className={metrics.expenseTrend <= 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(metrics.expenseTrend).toFixed(1)}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.currentProfit.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(metrics.profitTrend)}
                <span className={metrics.profitTrend >= 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(metrics.profitTrend).toFixed(1)}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash Runway</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.cashDays} days</div>
              <p className="text-xs text-muted-foreground">
                At current burn rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue vs Expenses Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Revenue & Expenses Trend</CardTitle>
                  <CardDescription>Monthly comparison over the last 12 months</CardDescription>
                </div>
                <Link to="/reports">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    View Reports
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
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
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
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
            </CardContent>
          </Card>

          {/* Expense Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Categories</CardTitle>
              <CardDescription>Breakdown by category this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
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
                    <span className="font-medium">${category.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Quick Stats */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest transactions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(activity.status)}
                      <div>
                        <p className="font-medium text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                    <div className={`font-medium ${activity.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {activity.amount > 0 ? '+' : ''}${Math.abs(activity.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Key business metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Invoices</span>
                  <Badge variant="secondary">{metrics.invoiceCount}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Paid Invoices</span>
                  <Badge variant="default">{metrics.paidInvoices}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Overdue</span>
                  <Badge variant="destructive">{metrics.overdueInvoices}</Badge>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Monthly Revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    ${metrics.avgMonthlyRevenue.toLocaleString()}
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
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </AppShell>
  );
};

export default Dashboard;
