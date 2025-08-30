import React, { useMemo, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/hooks/useCompany";
import DataTable from "@/components/dashboard/DataTable";

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
  const [typeFilter, setTypeFilter] = useState<"both" | "invoices" | "expenses">("both");

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

  const rows = useMemo(() => {
    const invRows = invoices.filter((i) => inRange(i.issueDate)).map((i) => ({
      type: "Invoice",
      date: i.issueDate,
      name: i.customer,
      amount: i.total,
      status: i.status,
      id: i.id,
    }));
    const expRows = expenses.filter((e) => inRange(e.date)).map((e) => ({
      type: "Expense",
      date: e.date,
      name: e.vendor,
      amount: e.amount,
      status: undefined,
      id: e.id,
    }));
    if (typeFilter === "invoices") return invRows;
    if (typeFilter === "expenses") return expRows;
    return [...invRows, ...expRows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [invoices, expenses, startDate, endDate, typeFilter]);

  const revenue = invoices.filter((i) => i.status !== "draft").reduce((s, i) => s + i.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = revenue - totalExpenses;

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

    const rowsHtml = rows.map(r => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #eee">${r.type}</td>
        <td style="padding:12px;border-bottom:1px solid #eee">${new Date(r.date).toLocaleDateString()}</td>
        <td style="padding:12px;border-bottom:1px solid #eee">${r.name}</td>
        <td style="padding:12px;border-bottom:1px solid #eee;text-align:right">$${Number(r.amount).toFixed(2)}</td>
        <td style="padding:12px;border-bottom:1px solid #eee">${r.status || '-'}</td>
      </tr>
    `).join('');

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
          <div className="flex flex-col">
            <label className="text-sm text-muted-foreground">Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="mt-1 px-3 py-2 border rounded">
              <option value="both">Invoices & Expenses</option>
              <option value="invoices">Invoices</option>
              <option value="expenses">Expenses</option>
            </select>
          </div>
        </div>

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
          <DataTable
            title="Report results"
            columns={[
              { key: 'type', label: 'Type', bold: true },
              { key: 'date', label: 'Date' },
              { key: 'name', label: 'Name' },
              { key: 'amount', label: 'Amount' },
              { key: 'status', label: 'Status' },
            ]}
            data={rows.map(r => ({
              id: r.id,
              type: r.type,
              date: new Date(r.date).toLocaleDateString(),
              name: r.name,
              amount: `$${r.amount.toFixed(2)}`,
              status: r.status || null,
            }))}
          />
        </div>
      </div>
    </AppShell>
  );
};

export default Reports;
