import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/AppShell";
import { useMemo } from "react";
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
import { listExpenses, listInvoices } from "@/store/demoData";
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
  
  const { chartData, metrics, recentActivity, expenseCategories } = useMemo(() => {
    // Build comprehensive dataset
    const months = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return d;
    });

    const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()+1}`;

    const invoices = listInvoices();
    const expenses = listExpenses();
    
    const chartData = months.map((m) => {
      const mk = monthKey(m);
      const earned = invoices
        .filter(i => i.status !== 'draft')
        .filter(i => monthKey(new Date(i.issueDate)) === mk)
        .reduce((s, i) => s + i.total, 0);
      const spent = expenses
        .filter(e => monthKey(new Date(e.date)) === mk)
        .reduce((s, e) => s + e.amount, 0);
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

    // Recent activity simulation
    const recentActivity = [
      { type: 'invoice', description: 'Invoice #1234 paid', amount: 2500, time: '2 hours ago', status: 'success' },
      { type: 'expense', description: 'Office supplies', amount: -150, time: '5 hours ago', status: 'neutral' },
      { type: 'invoice', description: 'Invoice #1233 sent', amount: 1800, time: '1 day ago', status: 'pending' },
      { type: 'expense', description: 'Software subscription', amount: -99, time: '2 days ago', status: 'neutral' },
      { type: 'invoice', description: 'Invoice #1232 overdue', amount: 3200, time: '3 days ago', status: 'warning' },
    ];

    // Expense categories
    const expenseCategories = [
      { name: 'Office Supplies', value: 2400, color: 'hsl(var(--primary))' },
      { name: 'Software', value: 1800, color: 'hsl(var(--secondary))' },
      { name: 'Marketing', value: 3200, color: 'hsl(var(--accent))' },
      { name: 'Travel', value: 1200, color: 'hsl(var(--destructive))' },
      { name: 'Utilities', value: 800, color: 'hsl(var(--muted))' }
    ];

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
          const dueDate = new Date(i.dueDate);
          const today = new Date();
          return i.status === 'sent' && dueDate < today;
        }).length,
        paidInvoices: invoices.filter(i => i.status === 'paid').length
      },
      recentActivity,
      expenseCategories
    };
  }, [user]);

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
      
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! 👋
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
    </AppShell>
  );
};

export default Dashboard;
