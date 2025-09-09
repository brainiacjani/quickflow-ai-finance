import React, { useMemo, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useCompany } from "@/hooks/useCompany";
import DataTable from "@/components/dashboard/DataTable";
import useClientPagination from '@/hooks/useClientPagination';

const toDateOnly = (d?: string | Date) => {
  if (!d) return null;
  const dt = typeof d === "string" ? new Date(d) : d;
  // normalize to YYYY-MM-DD
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

type UIInvoice = {
  id: string;
  customer: string;
  issueDate: string;
  total: number;
  status: string;
};

type UIExpense = {
  id: string;
  vendor: string;
  date: string;
  amount: number;
};

const mapInvoiceRow = (r: any): UIInvoice => {
  return {
    id: String(r.id),
    customer: r.customer || r.customer_name || r.client_name || "",
    issueDate: r.issuedate || r.issue_date || r.issueDate || r.created_at || "",
    total: Number(r.total ?? r.amount ?? 0),
    status: r.status || "",
  };
};

const mapExpenseRow = (r: any): UIExpense => {
  return {
    id: String(r.id),
    vendor: r.vendor || r.payee || "",
    date: r.date || r.expense_date || r.created_at || "",
    amount: Number(r.amount ?? r.total ?? 0),
  };
};

const Reports = () => {
  // defaults: start = 30 days ago, end = today
  const today = toDateOnly(new Date()) || "";
  const defaultStart = toDateOnly(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)) || "";

  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(today);

  // report selection
  const [reportType, setReportType] = useState<
    "profitloss" | "cashflow" | "sales_by_customer" | "expenses_by_vendor" | "custom"
  >("profitloss");

  // custom report options
  const [customIncludeInvoices, setCustomIncludeInvoices] = useState(true);
  const [customIncludeExpenses, setCustomIncludeExpenses] = useState(true);
  const [customGroupBy, setCustomGroupBy] = useState<"none" | "customer" | "vendor" | "month">("none");
  const [customAggregate, setCustomAggregate] = useState<"sum" | "count" | "avg">("sum");

  const [invoices, setInvoices] = useState<UIInvoice[]>([]);
  const [expenses, setExpenses] = useState<UIExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inRange = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return false;
    if (startDate) {
      const s = new Date(startDate + "T00:00:00");
      if (d < s) return false;
    }
    if (endDate) {
      const e = new Date(endDate + "T23:59:59");
      if (d > e) return false;
    }
    return true;
  };

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // The invoices table uses `issuedate` (no underscore) in other places.
        // Use that column for ordering and filters to avoid PostgREST 400 errors.
        const invoiceDateCol = 'issuedate';
        let invBuilder = supabase.from("invoices").select("*").order(invoiceDateCol, { ascending: true });
        if (startDate) invBuilder = invBuilder.gte(invoiceDateCol, startDate);
        if (endDate) invBuilder = invBuilder.lte(invoiceDateCol, endDate);

        const expBuilder = supabase.from("expenses").select("*").order("date", { ascending: true });
        if (startDate) expBuilder.gte("date", startDate);
        if (endDate) expBuilder.lte("date", endDate);

        const [invRes, expRes] = await Promise.all([invBuilder, expBuilder]);

        if (!mounted) return;

        if (invRes.error && expRes.error) {
          setError(invRes.error.message || expRes.error.message || "Failed to load data");
          setInvoices([]);
          setExpenses([]);
        } else {
          setInvoices((invRes.data || []).map(mapInvoiceRow));
          setExpenses((expRes.data || []).map(mapExpenseRow));
        }
      } catch (err: any) {
        console.error("reports fetch error", err);
        setError(err?.message || String(err));
        setInvoices([]);
        setExpenses([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [startDate, endDate]);

  // Build rows depending on selected report type or custom options
  const rows = useMemo(() => {
    const invFiltered = invoices.filter((i) => inRange(i.issueDate) && i.total != null && !Number.isNaN(i.total));
    const expFiltered = expenses.filter((e) => inRange(e.date) && e.amount != null && !Number.isNaN(e.amount));

    // helpers
    const toTx = (i: UIInvoice) => ({ type: 'Invoice', date: i.issueDate, name: i.customer, amount: Number(i.total), status: i.status, id: i.id });
    const toExp = (e: UIExpense) => ({ type: 'Expense', date: e.date, name: e.vendor, amount: Number(e.amount), status: undefined, id: e.id });

    if (reportType === 'cashflow') {
      // cashflow: combined chronologically with running balance (invoices positive, expenses negative)
      const txs = [...invFiltered.filter(i => i.status !== 'draft').map(toTx), ...expFiltered.map(toExp)].map(t => ({ ...t, signed: t.type === 'Invoice' ? Number(t.amount) : -Number(t.amount) }));
      txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let balance = 0;
      return txs.map((t, idx) => {
        balance += Number(t.signed || 0);
        return { id: `${t.id || idx}`, date: t.date, description: `${t.type} • ${t.name}`, inflow: t.signed > 0 ? t.signed : 0, outflow: t.signed < 0 ? Math.abs(t.signed) : 0, balance };
      });
    }

    if (reportType === 'sales_by_customer') {
      const map = new Map<string, { name: string; amount: number; count: number }>();
      invFiltered.forEach(i => {
        const k = i.customer || 'Unknown';
        const cur = map.get(k) ?? { name: k, amount: 0, count: 0 };
        cur.amount += Number(i.total);
        cur.count += 1;
        map.set(k, cur);
      });
      return Array.from(map.values()).sort((a, b) => b.amount - a.amount).map((r, idx) => ({ id: String(idx), name: r.name, amount: r.amount, count: r.count }));
    }

    if (reportType === 'expenses_by_vendor') {
      const map = new Map<string, { name: string; amount: number; count: number }>();
      expFiltered.forEach(e => {
        const k = e.vendor || 'Unknown';
        const cur = map.get(k) ?? { name: k, amount: 0, count: 0 };
        cur.amount += Number(e.amount);
        cur.count += 1;
        map.set(k, cur);
      });
      return Array.from(map.values()).sort((a, b) => b.amount - a.amount).map((r, idx) => ({ id: String(idx), name: r.name, amount: r.amount, count: r.count }));
    }

    if (reportType === 'profitloss') {
      // default combined transactions list similar to earlier behaviour
      const invRows = invFiltered.map(toTx);
      const expRows = expFiltered.map(toExp);
      return [...invRows, ...expRows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((r, idx) => ({ id: r.id || String(idx), type: r.type, date: r.date, name: r.name, amount: r.amount, status: r.status }));
    }

    // custom: build based on selections
    if (reportType === 'custom') {
      let items: any[] = [];
      if (customIncludeInvoices) items = items.concat(invFiltered.map(toTx));
      if (customIncludeExpenses) items = items.concat(expFiltered.map(toExp));

      if (customGroupBy === 'none') {
        // return raw transactions
        return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((r, idx) => ({ id: r.id || String(idx), type: r.type, date: r.date, name: r.name, amount: r.amount }));
      }

      if (customGroupBy === 'customer' || customGroupBy === 'vendor') {
        const keyFn = (r: any) => r.name || 'Unknown';
        const map = new Map<string, { name: string; amount: number; count: number }>();
        items.forEach((it) => {
          const k = keyFn(it);
          const cur = map.get(k) ?? { name: k, amount: 0, count: 0 };
          cur.amount += Number(it.amount || 0);
          cur.count += 1;
          map.set(k, cur);
        });
        const arr = Array.from(map.values());
        if (customAggregate === 'sum') return arr.map((r, idx) => ({ id: String(idx), name: r.name, value: r.amount, count: r.count }));
        if (customAggregate === 'count') return arr.map((r, idx) => ({ id: String(idx), name: r.name, value: r.count }));
        if (customAggregate === 'avg') return arr.map((r, idx) => ({ id: String(idx), name: r.name, value: r.amount / Math.max(1, r.count) }));
      }

      if (customGroupBy === 'month') {
        const map = new Map<string, { month: string; amount: number }>();
        items.forEach(it => {
          const dt = new Date(it.date);
          const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
          const cur = map.get(key) ?? { month: key, amount: 0 };
          cur.amount += Number(it.amount || 0);
          map.set(key, cur);
        });
        return Array.from(map.values()).sort((a,b) => a.month.localeCompare(b.month)).map((r, idx) => ({ id: String(idx), month: r.month, value: r.amount }));
      }
    }

    return [];
  }, [invoices, expenses, startDate, endDate, reportType, customIncludeInvoices, customIncludeExpenses, customGroupBy, customAggregate]);

  const revenue = invoices.filter((i) => i.status !== "draft").reduce((s, i) => s + i.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = revenue - totalExpenses;

  // Build table data for current reportType and paginate client-side
  const tableData = useMemo(() => {
    if (reportType === 'cashflow') {
      return rows.map((r) => ({
        id: r.id,
        date: r.date ? new Date(r.date).toLocaleDateString() : '-',
        description: r.description,
        inflow: r.inflow ? `$${Number(r.inflow).toFixed(2)}` : '-',
        outflow: r.outflow ? `$${Number(r.outflow).toFixed(2)}` : '-',
        balance: `$${Number(r.balance || 0).toFixed(2)}`,
      }));
    }

    const isGrouped =
      reportType === 'sales_by_customer' ||
      reportType === 'expenses_by_vendor' ||
      (reportType === 'custom' && (customGroupBy === 'customer' || customGroupBy === 'vendor' || customGroupBy === 'month'));

    if (isGrouped) {
      return rows.map((r) => {
        const name = r.name ?? r.month ?? '-';
        const rawValue = r.amount ?? r.value;
        const value = rawValue !== undefined && rawValue !== null ? `$${Number(rawValue).toFixed(2)}` : '-';
        const count = r.count ?? null;
        return { id: r.id, name, value, count };
      });
    }

    return rows.map((r) => {
      const amountRaw = r.amount ?? r.value;
      const amount = amountRaw !== undefined && amountRaw !== null ? `$${Number(amountRaw).toFixed(2)}` : '-';
      return {
        id: r.id,
        type: r.type,
        date: r.date ? new Date(r.date).toLocaleDateString() : '-',
        name: r.name || '-',
        amount,
        status: r.status || null,
      };
    });
  }, [rows, reportType, customGroupBy]);

  // tableData can have multiple shapes depending on the report; cast to any for the client-side pagination hook
  const { paginatedItems, currentPage, totalPages, setPage } = useClientPagination<any>(tableData as any, 10);

  const exportCSV = () => {
    const header = ["Type", "Date", "Name", "Amount", "Status"];
    const csvRows = [header, ...rows.map((r) => [r.type, r.date, r.name, r.amount.toFixed(2), r.status || "-"])];
    const csv = csvRows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quickflow-report-${startDate || "all"}-to-${endDate || "all"}.csv`;
    a.click();
  };

  const { data: company } = useCompany();

  const printPDF = () => {
    const logo = company && (company as any).logo_url ? `<img src="${(company as any).logo_url}" alt="${company?.name || 'Logo'}" style="height:48px;object-fit:contain;border-radius:6px;" />` : '';
    const companyName = company?.name || 'Your Company';
    const rangeText = `${startDate || 'All dates'} — ${endDate || 'All dates'}`;

    const rowsHtml = rows.map(r => {
      // support different row shapes (cashflow, aggregates, transactions)
      if (r.inflow !== undefined || r.outflow !== undefined) {
        return `<tr>
          <td style="padding:12px;border-bottom:1px solid #eee">${new Date(r.date).toLocaleDateString()}</td>
          <td style="padding:12px;border-bottom:1px solid #eee">${r.description}</td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:right">${r.inflow ? '$' + Number(r.inflow).toFixed(2) : '-'}</td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:right">${r.outflow ? '$' + Number(r.outflow).toFixed(2) : '-'}</td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:right">$${Number(r.balance || 0).toFixed(2)}</td>
        </tr>`;
      }
      if (r.month) {
        return `<tr>
          <td style="padding:12px;border-bottom:1px solid #eee">${r.month}</td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:right">$${Number(r.value || 0).toFixed(2)}</td>
        </tr>`;
      }
      if (r.name && r.value !== undefined) {
        return `<tr>
          <td style="padding:12px;border-bottom:1px solid #eee">${r.name}</td>
          <td style="padding:12px;border-bottom:1px solid #eee;text-align:right">$${Number(r.value).toFixed(2)}</td>
        </tr>`;
      }
      return `<tr>
        <td style="padding:12px;border-bottom:1px solid #eee">${r.type || ''}</td>
        <td style="padding:12px;border-bottom:1px solid #eee">${r.date ? new Date(r.date).toLocaleDateString() : ''}</td>
        <td style="padding:12px;border-bottom:1px solid #eee">${r.name || ''}</td>
        <td style="padding:12px;border-bottom:1px solid #eee;text-align:right">${r.amount !== undefined ? '$' + Number(r.amount).toFixed(2) : (r.count !== undefined ? r.count : '-')}</td>
        <td style="padding:12px;border-bottom:1px solid #eee">${r.status || '-'}</td>
      </tr>`;
    }).join('');

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Report - ${companyName}</title>
          <style>
            body { font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #222; }
            .letterhead { padding: 24px 32px; display:flex; justify-content:space-between; align-items:center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
            .company { display:flex; align-items:center; gap:12px; }
            .company-name { font-size:18px; font-weight:700; letter-spacing:0.4px; }
            .report-meta { padding:18px 32px; border-bottom:1px solid #eee; }
            .report-title { font-size:20px; font-weight:700; margin-bottom:6px; }
            table { width:100%; border-collapse:collapse; margin:18px 32px; background: white; }
            th { text-align:left; padding:12px; background:#f7f8fb; border-bottom:2px solid #e6e9ef; font-size:12px; text-transform:uppercase; }
            td { font-size:13px; }
            @media print {
              body { margin:0; }
              .letterhead { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="letterhead">
            <div class="company">
              ${logo}
              <div class="company-name">${companyName}</div>
            </div>
            <div class="company-contact">QuickFlow Reports</div>
          </div>
          <div class="report-meta">
            <div class="report-title">Filtered Report</div>
            <div style="color:#6b7280">${rangeText}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Date</th>
                <th>Name</th>
                <th style="text-align:right">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="5" style="padding:18px;text-align:center;color:#6b7280">No records</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    // Allow images to load before printing
    setTimeout(() => w.print(), 300);
  };

  return (
    <AppShell>
      <Helmet>
        <title>Reports | QuickFlow</title>
        <meta name="description" content="Profit & Loss and filtered invoices/expenses reports. Export to CSV or PDF." />
        <link rel="canonical" href="https://quickflow.app/reports" />
      </Helmet>

      <div className="container py-8 grid gap-6">
        <h1 className="text-2xl font-semibold">Reports</h1>

        <div className="grid md:grid-cols-3 gap-3 max-w-3xl">
          <div className="flex flex-col">
            <label className="text-sm text-muted-foreground">Start date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 px-3 py-2 border rounded" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-muted-foreground">End date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 px-3 py-2 border rounded" />
          </div>
          <div className="flex items-end">
            <div className="text-sm text-muted-foreground">Choose a report from the deck below</div>
          </div>
        </div>

        {/* Responsive card deck */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl">
          <Card onClick={() => setReportType('profitloss')} className={`hover-scale cursor-pointer ${reportType === 'profitloss' ? 'border-indigo-500 bg-indigo-50' : ''}`}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Profit & Loss</CardTitle>
              <div className="text-xs text-muted-foreground mt-1">Transactions</div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">${profit.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card onClick={() => setReportType('cashflow')} className={`hover-scale cursor-pointer ${reportType === 'cashflow' ? 'border-indigo-500 bg-indigo-50' : ''}`}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">View</div>
              <div className="text-xs text-muted-foreground">Inflows / Outflows</div>
            </CardContent>
          </Card>

          <Card onClick={() => setReportType('sales_by_customer')} className={`hover-scale cursor-pointer ${reportType === 'sales_by_customer' ? 'border-indigo-500 bg-indigo-50' : ''}`}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Sales per customer</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{invoices.length}</div>
              <div className="text-xs text-muted-foreground">Invoices</div>
            </CardContent>
          </Card>

          <Card onClick={() => setReportType('expenses_by_vendor')} className={`hover-scale cursor-pointer ${reportType === 'expenses_by_vendor' ? 'border-indigo-500 bg-indigo-50' : ''}`}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Expenses per vendor</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Total expenses</div>
            </CardContent>
          </Card>

          <Card onClick={() => setReportType('custom')} className={`hover-scale cursor-pointer ${reportType === 'custom' ? 'border-indigo-500 bg-indigo-50' : ''}`}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Custom report</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground">Build grouped/aggregated reports</div>
            </CardContent>
          </Card>
        </div>

        {reportType === 'custom' && (
          <div className="grid md:grid-cols-4 gap-3 max-w-3xl mt-3">
            <label className="flex items-center gap-2"><input type="checkbox" checked={customIncludeInvoices} onChange={(e) => setCustomIncludeInvoices(e.target.checked)} /> Include invoices</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={customIncludeExpenses} onChange={(e) => setCustomIncludeExpenses(e.target.checked)} /> Include expenses</label>
            <div>
              <label className="text-sm text-muted-foreground">Group by</label>
              <select value={customGroupBy} onChange={(e) => setCustomGroupBy(e.target.value as any)} className="mt-1 px-3 py-2 border rounded w-full">
                <option value="none">No grouping (transactions)</option>
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
                <option value="month">Month</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Aggregate</label>
              <select value={customAggregate} onChange={(e) => setCustomAggregate(e.target.value as any)} className="mt-1 px-3 py-2 border rounded w-full">
                <option value="sum">Sum</option>
                <option value="count">Count</option>
                <option value="avg">Average</option>
              </select>
            </div>
          </div>
        )}

        <div className="grid gap-3 max-w-md">
          <div className="flex items-center justify-between"><span>Revenue</span><span className="font-semibold">${revenue.toFixed(2)}</span></div>
          <div className="flex items-center justify-between"><span>Expenses</span><span className="font-semibold">${totalExpenses.toFixed(2)}</span></div>
          <div className="flex items-center justify-between border-t pt-2"><span>Profit</span><span className="font-semibold">${profit.toFixed(2)}</span></div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
          <Button onClick={printPDF}>Export PDF</Button>
        </div>

        <div className="mt-2">
          {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
          {error && <div className="text-sm text-destructive">{error}</div>}
        </div>

        <div className="mt-4">
          {/* Choose columns dynamically based on report type */}
          {reportType === 'cashflow' ? (
            <DataTable
              title="Cash flow"
              isLoading={loading}
              columns={[
                { key: 'date', label: 'Date', bold: true },
                { key: 'description', label: 'Description' },
                { key: 'inflow', label: 'Inflow' },
                { key: 'outflow', label: 'Outflow' },
                { key: 'balance', label: 'Balance' },
              ]}
              data={paginatedItems}
            />
          ) : reportType === 'sales_by_customer' || reportType === 'expenses_by_vendor' || (reportType === 'custom' && (customGroupBy === 'customer' || customGroupBy === 'vendor' || customGroupBy === 'month')) ? (
            <DataTable
              title="Grouped results"
              isLoading={loading}
              columns={reportType === 'sales_by_customer' || reportType === 'expenses_by_vendor' || (customGroupBy === 'customer' || customGroupBy === 'vendor') ? [
                { key: 'name', label: customGroupBy === 'month' ? 'Month' : 'Name', bold: true },
                { key: 'value', label: 'Amount' },
                { key: 'count', label: 'Count' },
              ] : [ { key: 'month', label: 'Month' }, { key: 'value', label: 'Amount' } ]}
              data={paginatedItems}
            />
          ) : (
            <DataTable
              title="Report results"
              isLoading={loading}
              columns={[
                { key: 'type', label: 'Type', bold: true },
                { key: 'date', label: 'Date' },
                { key: 'name', label: 'Name' },
                { key: 'amount', label: 'Amount' },
                { key: 'status', label: 'Status' },
              ]}
              data={paginatedItems}
            />
          )}
        </div>

        <div className="flex justify-center gap-2 mt-4">
          <Button disabled={currentPage === 1} onClick={() => setPage(1)}>« First</Button>
          <Button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹ Prev</Button>
          <span className="flex items-center gap-1">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>
          <Button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next ›</Button>
          <Button disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}>Last »</Button>
        </div>
      </div>
    </AppShell>
  );
};

export default Reports;
