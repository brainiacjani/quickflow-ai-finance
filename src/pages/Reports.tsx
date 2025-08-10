import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { listExpenses, listInvoices } from "@/store/demoData";
import { Button } from "@/components/ui/button";

const Reports = () => {
  const inv = listInvoices();
  const exp = listExpenses();
  const revenue = inv.filter(i => i.status !== 'draft').reduce((s, i) => s + i.total, 0);
  const expenses = exp.reduce((s, e) => s + e.amount, 0);
  const profit = revenue - expenses;

  const exportCSV = () => {
    const rows = [
      ['Type','Date','Name','Amount'],
      ...inv.map(i => ['Invoice', i.issueDate, i.customer, i.total]),
      ...exp.map(e => ['Expense', e.date, e.vendor, e.amount]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'quickflow-report.csv'; a.click();
  };

  const printPDF = () => window.print();

  return (
    <AppShell>
      <Helmet>
        <title>Reports | QuickFlow</title>
        <meta name="description" content="Simple Profit & Loss and cashflow reports. Export to CSV or PDF." />
        <link rel="canonical" href="https://quickflow.app/reports" />
      </Helmet>
      <div className="container py-8 grid gap-6">
        <h1 className="text-2xl font-semibold">Profit & Loss</h1>
        <div className="grid gap-3 max-w-md">
          <div className="flex items-center justify-between"><span>Revenue</span><span className="font-semibold">${revenue.toFixed(2)}</span></div>
          <div className="flex items-center justify-between"><span>Expenses</span><span className="font-semibold">${expenses.toFixed(2)}</span></div>
          <div className="flex items-center justify-between border-t pt-2"><span>Profit</span><span className="font-semibold">${profit.toFixed(2)}</span></div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
          <Button onClick={printPDF}>Export PDF</Button>
        </div>
      </div>
    </AppShell>
  );
};

export default Reports;
