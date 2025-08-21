import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMemo, useState, useRef, useEffect } from "react";
import { Expense } from "@/store/demoData";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";


const guessCategory = (vendor: string, amount: number): { category: string; confidence: number } => {
  const v = vendor.toLowerCase();
  if (v.includes("aws") || v.includes("azure") || v.includes("gcp")) return { category: "Cloud", confidence: 0.82 };
  if (v.includes("uber") || v.includes("lyft")) return { category: "Travel", confidence: 0.76 };
  if (v.includes("amazon") || v.includes("staples")) return { category: "Office Supplies", confidence: 0.71 };
  if (amount > 500) return { category: "Contractors", confidence: 0.66 };
  return { category: "General", confidence: 0.55 };
};

const Expenses = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<any[]>([]);
  const { data: profile } = useProfile();
  const isAdmin = Boolean((profile as any)?.is_admin || user?.user_metadata?.role === 'admin');

  const suggestion = useMemo(() => guessCategory(vendor, amount), [vendor, amount]);

  const addExpense = async () => {
    if (!user?.id) {
      toast({ title: 'Not signed in', description: 'Please sign in to add expenses.' });
      return;
    }
    const exp: Expense = { id: crypto.randomUUID(), date, vendor, amount, category: category || suggestion.category, note };
    try {
      const payload = { id: exp.id, date: exp.date, vendor: exp.vendor, amount: exp.amount, category: exp.category, note: exp.note, created_by: user.id };
      const { error } = await supabase.from('expenses').insert(payload);
      if (error) throw error;
      await fetchExpenses();
      setVendor(""); setAmount(0); setCategory(""); setNote("");
    } catch (e) {
      console.error('addExpense error', e);
      toast({ title: 'Save failed', description: 'Unable to save expense.' });
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/expense-template.csv';
    link.download = 'expense-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      let imported = 0;
      let errors = 0;
      const toInsert: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim());
        
        try {
          const expense: Expense = {
            id: crypto.randomUUID(),
            date: values[0] || new Date().toISOString().slice(0,10),
            vendor: values[1] || '',
            amount: parseFloat(values[2]) || 0,
            category: values[3] || 'General',
            note: values[4] || ''
          };

          if (expense.vendor && expense.amount > 0) {
            toInsert.push({ id: expense.id, date: expense.date, vendor: expense.vendor, amount: expense.amount, category: expense.category, note: expense.note, created_by: user?.id ?? null });
            imported++;
          } else {
            errors++;
          }
        } catch {
          errors++;
        }
      }

      try {
        if (toInsert.length > 0) {
          const { error } = await supabase.from('expenses').insert(toInsert);
          if (error) throw error;
          await fetchExpenses();
        }
      } catch (e) {
        console.error('importExpenses error', e);
        toast({ title: 'Import failed', description: 'Unable to import expenses.' });
      }

      toast({
        title: "Import Complete",
        description: `Imported ${imported} expenses${errors > 0 ? `. ${errors} rows had errors.` : '.'}`,
      });
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fetchExpenses = async () => {
    try {
      if (!user?.id) { setExpenses([]); return; }
      let q = supabase.from('expenses').select('*').order('date', { ascending: false });
      if (!isAdmin) q = q.eq('created_by', user.id);
      const { data, error } = await q;
      if (error) throw error;
      setExpenses(data ?? []);
    } catch (e) {
      console.error('fetchExpenses error', e);
    }
  };

  useEffect(() => { fetchExpenses(); }, [user?.id, isAdmin]);

  return (
    <AppShell>
      <Helmet>
        <title>Expenses | QuickFlow</title>
        <meta name="description" content="Track expenses, upload receipts, and let AI suggest categories." />
        <link rel="canonical" href="https://quickflow.app/expenses" />
      </Helmet>

      <div className="container py-8 grid gap-8">
        <section className="grid gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Add expense</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Template
              </Button>
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
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
