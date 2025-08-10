import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { Expense, saveExpense, listExpenses } from "@/store/demoData";


const guessCategory = (vendor: string, amount: number): { category: string; confidence: number } => {
  const v = vendor.toLowerCase();
  if (v.includes("aws") || v.includes("azure") || v.includes("gcp")) return { category: "Cloud", confidence: 0.82 };
  if (v.includes("uber") || v.includes("lyft")) return { category: "Travel", confidence: 0.76 };
  if (v.includes("amazon") || v.includes("staples")) return { category: "Office Supplies", confidence: 0.71 };
  if (amount > 500) return { category: "Contractors", confidence: 0.66 };
  return { category: "General", confidence: 0.55 };
};

const Expenses = () => {
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  const suggestion = useMemo(() => guessCategory(vendor, amount), [vendor, amount]);

  const addExpense = () => {
    const exp: Expense = { id: crypto.randomUUID(), date, vendor, amount, category: category || suggestion.category, note };
    saveExpense(exp);
    setVendor(""); setAmount(0); setCategory(""); setNote("");
  };

  const expenses = listExpenses();

  return (
    <AppShell>
      <Helmet>
        <title>Expenses | QuickFlow</title>
        <meta name="description" content="Track expenses, upload receipts, and let AI suggest categories." />
        <link rel="canonical" href="https://quickflow.app/expenses" />
      </Helmet>

      <div className="container py-8 grid gap-8">
        <section className="grid gap-4">
          <h1 className="text-2xl font-semibold">Add expense</h1>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <label className="text-sm">Date</label>
              <input type="date" className="rounded-md border bg-background px-3 py-2" value={date} onChange={e=>setDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Vendor</label>
              <input className="rounded-md border bg-background px-3 py-2" value={vendor} onChange={e=>setVendor(e.target.value)} placeholder="Amazon" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Amount</label>
              <input type="number" className="rounded-md border bg-background px-3 py-2" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm">Category</label>
              <input className="rounded-md border bg-background px-3 py-2" value={category} onChange={e=>setCategory(e.target.value)} placeholder="e.g. Office Supplies" />
              <p className="text-xs text-muted-foreground">AI suggests: <span className="font-medium">{suggestion.category}</span> ({Math.round(suggestion.confidence*100)}% confidence)</p>
            </div>
            <div className="md:col-span-2 grid gap-2">
              <label className="text-sm">Note</label>
              <textarea className="rounded-md border bg-background px-3 py-2" value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div>
            <Button variant="hero" onClick={addExpense}>Save expense</Button>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-semibold">Recent expenses</h2>
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Vendor</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="p-3">{e.date}</td>
                    <td className="p-3">{e.vendor}</td>
                    <td className="p-3">{e.category}</td>
                    <td className="p-3">${e.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Expenses;
