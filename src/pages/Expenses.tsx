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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import DataTable from "@/components/dashboard/DataTable";
import useClientPagination from "@/hooks/useClientPagination";


const guessCategory = (vendor: string, amount: number): { category: string; confidence: number } => {
  const v = vendor.toLowerCase();
  if (v.includes("aws") || v.includes("azure") || v.includes("gcp")) return { category: "Cloud", confidence: 0.82 };
  if (v.includes("uber") || v.includes("lyft")) return { category: "Travel", confidence: 0.76 };
  if (v.includes("amazon") || v.includes("staples")) return { category: "Office Supplies", confidence: 0.71 };
  if (amount > 500) return { category: "Contractors", confidence: 0.66 };
  return { category: "General", confidence: 0.55 };
};

// Robust currency formatter: strips currency symbols and returns fixed 2-decimal string
const formatCurrency = (value: unknown) => {
  const raw = String(value ?? "");
  const num = parseFloat(raw.replace(/[^0-9.-]+/g, ""));
  if (Number.isNaN(num)) return "0.00";
  return num.toFixed(2);
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
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: profile } = useProfile();
  const isAdmin = Boolean((profile as any)?.is_admin || user?.user_metadata?.role === 'admin');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // vendor dropdown state
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [vendorQueryLocal, setVendorQueryLocal] = useState<string>('');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);

  const suggestion = useMemo(() => guessCategory((vendor || vendorQueryLocal || ''), amount), [vendor, vendorQueryLocal, amount]);

  // client side pagination
  const { paginatedItems: paginatedExpenses, currentPage: expensePage, totalPages: expenseTotalPages, setPage: setExpensePage } = useClientPagination(expenses, 10);
  
  const filteredExpenses = (expenses || []).filter(e => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return true;
    const vendorName = (e.vendor || '').toString().toLowerCase();
    return vendorName.includes(q);
  });

  const addExpense = async () => {
    if (!user?.id) {
      toast({ title: 'Not signed in', description: 'Please sign in to add expenses.' });
      return;
    }
    const vendorName = (vendor || vendorQueryLocal || '').trim();
    if (!vendorName) {
      toast({ title: 'Missing vendor', description: 'Please select or enter a vendor.' });
      return;
    }

    const exp: Expense = { id: crypto.randomUUID(), date, vendor: vendorName, amount, category: category || suggestion.category, note };
    try {
      const payload = { id: exp.id, date: exp.date, vendor: exp.vendor, amount: exp.amount, category: exp.category, note: exp.note, created_by: user.id };
      const { error } = await supabase.from('expenses').insert(payload);
      if (error) throw error;
      await fetchExpenses();
      setVendor(""); setVendorQueryLocal(''); setAmount(0); setCategory(""); setNote("");
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
      setLoading(true);
      if (!user?.id) { setExpenses([]); return; }
      let q = supabase.from('expenses').select('*').order('date', { ascending: false });
      if (!isAdmin) q = q.eq('created_by', user.id);
      const { data, error } = await q;
      if (error) throw error;
      setExpenses(data ?? []);
    } catch (e) {
      console.error('fetchExpenses error', e);
    } finally {
      setLoading(false);
    }
  };

  // fetch vendors for dropdown
  const fetchVendors = async () => {
    try {
      if (!user?.id) return;
      let q = supabase.from('vendors').select('id,name,email,created_by').order('name', { ascending: true });
      if (!isAdmin) q = q.eq('created_by', user.id);
      const { data, error } = await q;
      if (error) throw error;
      setVendorsList(data ?? []);
    } catch (e) {
      console.error('fetchVendors error', e);
    }
  };

  useEffect(() => { fetchExpenses(); }, [user?.id, isAdmin]);
  useEffect(() => { fetchVendors(); }, [user?.id, isAdmin]);

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [creatorName, setCreatorName] = useState<string | null>(null);

  const openView = (e: any) => {
    setSelectedExpense(e);
    setCreatorName(null);
    setViewModalOpen(true);

    // fetch creator's profile first name for display
    (async () => {
      try {
        if (!e?.created_by) return;
        const { data, error } = await supabase.from('profiles').select('first_name,display_name,email').eq('id', e.created_by).maybeSingle();
        if (error) throw error;
        const name = data?.first_name ?? data?.display_name ?? data?.email ?? e.created_by;
        setCreatorName(name ?? null);
      } catch (err) {
        console.error('fetch creator profile error', err);
        setCreatorName(e.created_by ?? null);
      }
    })();
  };

  const closeView = () => {
    setSelectedExpense(null);
    setViewModalOpen(false);
  };

  return (
    <AppShell>
      <Helmet>
        <title>Expenses | QuickFlow</title>
        <meta name="description" content="Track expenses, upload receipts, and let AI suggest categories." />
        <link rel="canonical" href="https://quickflow.app/expenses" />
      </Helmet>

      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-8 grid gap-8">
        <section className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <div className="flex items-center gap-3">
            <div className="w-56">
              <input className="w-full rounded-md border bg-background px-3 py-2" placeholder="Search by vendor" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div>
              <Button variant="hero" onClick={() => { setVendor(''); setAmount(0); setCategory(''); setNote(''); setCreateDialogOpen(true); }}>Create New Expense</Button>
            </div>
          </div>
        </section>

        {/* Create expense dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create expense</DialogTitle>
              <DialogDescription>Fill out the expense details and save.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm">Date</label>
                <input type="date" className="rounded-md border bg-background px-3 py-2 w-full" value={date} onChange={e=>setDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm">Vendor</label>
                <div className="relative">
                  <input
                    className="rounded-md border bg-background px-3 py-2 w-full"
                    placeholder="Search vendors or type a name"
                    value={vendorQueryLocal || vendor}
                    onFocus={() => { setShowVendorDropdown(true); setVendorQueryLocal(''); }}
                    onChange={(e) => { setVendorQueryLocal(e.target.value); setShowVendorDropdown(true); }}
                    onBlur={() => { setTimeout(() => setShowVendorDropdown(false), 150); }}
                    autoComplete="off"
                  />
                  {showVendorDropdown && (
                    <div className="absolute z-50 top-full left-0 mt-2 w-full max-h-48 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-lg">
                      {(() => {
                        const q = (vendorQueryLocal || '').trim().toLowerCase();
                        const filtered = (vendorsList || []).filter((v: any) => {
                          const name = (v.name || '').toString().toLowerCase();
                          const email = (v.email || '').toString().toLowerCase();
                          return !q || name.includes(q) || email.includes(q);
                        }).slice(0, 20);

                        if (filtered.length === 0) {
                          return (
                            <div className="p-3 text-sm text-muted-foreground">No vendors found. Type a new name and save to create a vendor inline.</div>
                          );
                        }

                        return filtered.map((v: any) => (
                          <div key={v.id} className="px-3 py-2 hover:bg-accent/10 cursor-pointer" onMouseDown={(ev) => ev.preventDefault()} onClick={() => { setVendor(v.name); setVendorQueryLocal(''); setShowVendorDropdown(false); }}>
                            <div className="font-medium">{v.name}</div>
                            {v.email && <div className="text-xs text-muted-foreground">{v.email}</div>}
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm">Amount</label>
                <input type="number" className="rounded-md border bg-background px-3 py-2 w-full" value={amount} onChange={e=>setAmount(Number(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm">Category</label>
                <input className="rounded-md border bg-background px-3 py-2 w-full" value={category} onChange={e=>setCategory(e.target.value)} placeholder="e.g. Office Supplies" />
                <p className="text-xs text-muted-foreground">AI suggests: <span className="font-medium">{suggestion.category}</span> ({Math.round(suggestion.confidence*100)}% confidence)</p>
              </div>
              <div className="sm:col-span-2 grid gap-2">
                <label className="text-sm">Note</label>
                <textarea className="rounded-md border bg-background px-3 py-2 w-full" value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="mt-4">
              <Button variant="hero" onClick={async () => { await addExpense(); setCreateDialogOpen(false); }}>Save expense</Button>
            </div>
          </DialogContent>
        </Dialog>

        <section className="grid gap-4">
          <h2 className="text-xl font-semibold">Recent expenses</h2>
          <DataTable
            title="Expenses"
            columns={[
              { key: 'date', label: 'Date' , bold: true},
              { key: 'vendor', label: 'Vendor' },
              { key: 'category', label: 'Category' },
              { key: 'amount', label: 'Amount' },
            ]}
            isLoading={loading}
            data={
              // use client-side filtered + paginated results
              paginatedExpenses.filter(e => filteredExpenses.includes(e)).map(e => ({
               id: e.id,
               date: e.date,
               vendor: e.vendor,
               category: e.category,
               amount: `$${Number(e.amount ?? 0).toFixed(2)}`,
               created_by: e.created_by,
             }))}
            renderActions={(row) => (
              <>
                {/* Pass original expense object to openView to preserve numeric amount and metadata */}
                <Button size="sm" variant="ghost" onClick={() => openView(expenses.find(ex => ex.id === row.id) ?? row)}>View</Button>
              </>
            )}
          />

          {/* pagination controls */}
          <div className="flex items-center justify-end space-x-3 mt-4">
            <Button size="sm" variant="ghost" onClick={() => setExpensePage(Math.max(1, expensePage - 1))} disabled={expensePage === 1}>Prev</Button>

            <div className="flex items-center space-x-2">
              {Array.from({ length: Math.max(1, Math.ceil(filteredExpenses.length / 10)) }).map((_, idx) => {
                const p = idx + 1;
                return (
                  <Button key={p} size="sm" variant={p === expensePage ? 'default' : 'ghost'} onClick={() => setExpensePage(p)}>{p}</Button>
                );
              })}
            </div>

            <Button size="sm" onClick={() => setExpensePage(Math.min(Math.max(1, Math.ceil(filteredExpenses.length / 10)), expensePage + 1))} disabled={expensePage === Math.max(1, Math.ceil(filteredExpenses.length / 10))}>Next</Button>
          </div>
        </section>

        {/* Expense view modal */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent>
            <div className="p-4">
              <DialogTitle>Expense details</DialogTitle>
              <DialogDescription>Full details for the selected expense</DialogDescription>
              {selectedExpense ? (
                <Card className="mt-4 bg-white">
                  <CardContent>
                    <div className="grid gap-2">
                      <div><strong>Date:</strong> {selectedExpense.date}</div>
                      <div><strong>Vendor:</strong> {selectedExpense.vendor}</div>
                      <div><strong>Category:</strong> {selectedExpense.category}</div>
                      <div><strong>Amount:</strong> ${formatCurrency(selectedExpense.amount)}</div>
                      <div><strong>Notes:</strong></div>
                      <div className="whitespace-pre-wrap p-2 bg-muted/5 rounded">{selectedExpense.note ?? '—'}</div>
                      {selectedExpense.receipt_url && (
                        <div>
                          <strong>Receipt:</strong>
                          <div className="mt-2">
                            <a href={selectedExpense.receipt_url} target="_blank" rel="noreferrer" className="text-primary underline">View receipt</a>
                          </div>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">Created by: {creatorName ?? selectedExpense.created_by ?? '—'}</div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button onClick={() => { closeView(); }}>Close</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div>Loading…</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
};

export default Expenses;
