import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/dashboard/DataTable";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value || 0);

const Inventory = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  // dialog state for editing via pop-up
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // search
  const [searchQuery, setSearchQuery] = useState("");

  const fetchItems = async () => {
    try {
      setLoading(true);
      if (!user?.id) { setItems([]); return; }
      let q = supabase.from('inventory').select('*').order('created_at', { ascending: false });
      // show only items created by the user unless admin
      const isAdmin = Boolean((profile as any)?.is_admin || user?.user_metadata?.role === 'admin');
      if (!isAdmin) q = q.eq('created_by', user?.id);
      const { data, error } = await q;
      if (error) throw error;
      setItems(data ?? []);
    } catch (e) {
      console.error('fetchItems error', e);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [user?.id]);

  // reset to first page when search or total items change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, items.length]);

  const filteredItems = (items || []).filter(it => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return true;
    const name = (it.name || '').toString().toLowerCase();
    const sku = (it.sku || '').toString().toLowerCase();
    return name.includes(q) || sku.includes(q);
  });

  const saveItem = async () => {
    try {
      const payload = { name, sku: sku || null, price: price === "" ? null : price, stock: Number(stock) || 0, description: description || null };
      if (editingId) {
        const { error } = await supabase.from('inventory').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const insertPayload = { ...payload, created_by: user?.id ?? null };
        const { error } = await supabase.from('inventory').insert(insertPayload);
        if (error) throw error;
      }
      setName(''); setSku(''); setPrice(''); setStock(''); setDescription(''); setEditingId(null);
      fetchItems();
    } catch (e) {
      console.error('saveItem error', e);
      alert('Failed to save inventory item');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) throw error;
      fetchItems();
    } catch (e) {
      console.error('deleteItem error', e);
      alert('Failed to delete item');
    }
  };

  const editItem = (id: string) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    setEditingId(id);
    setName(it.name || '');
    setSku(it.sku || '');
    setPrice(it.price ?? '');
    setStock(it.stock ?? '');
    setDescription(it.description || '');
    setEditDialogOpen(true);
  };

  return (
    <AppShell>
      <Helmet><title>Inventory | QuickFlow</title></Helmet>
      <div className="grid gap-8 py-8">
        <section className="panel-surface grid-muted relative overflow-hidden rounded-[2rem] px-6 py-6 sm:px-8 sm:py-7">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(14,116,144,0.12),transparent_55%)] lg:block" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Stock control
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Inventory</h1>
              <p className="mt-2 max-w-xl text-base text-muted-foreground">Track stock, pricing, and SKUs with the same calmer table and modal surfaces used in the rest of the workspace.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <div className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-sm text-foreground/80">{filteredItems.length} inventory items</div>
              </div>
            </div>
            <div>
              <Button className="rounded-full" variant="hero" onClick={() => { setEditingId(null); setName(''); setSku(''); setPrice(''); setStock(''); setDescription(''); setEditDialogOpen(true); }}>Add New</Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">All items</h2>
              <p className="mt-1 text-sm text-muted-foreground">Search products by name or SKU and maintain inventory details in one consistent table.</p>
            </div>
            <div className="w-full sm:w-80">
              <input className="w-full rounded-2xl border border-border/80 bg-card px-4 py-3 shadow-sm" placeholder="Search by name or SKU" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <DataTable
              title="Inventory"
              isLoading={loading}
              columns={[
                { key: 'name', label: 'Name', bold: true },
                { key: 'sku', label: 'SKU' },
                { key: 'price', label: 'Price' },
                { key: 'stock', label: 'Stock' },
              ]}
            data={
              // paginate filtered items client-side
              (() => {
                const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
                const start = (currentPage - 1) * pageSize;
                const paginated = filteredItems.slice(start, start + pageSize);
                return paginated.map(i => ({ id: i.id, name: i.name, sku: i.sku, price: i.price ? `$${Number(i.price).toFixed(2)}` : '-', stock: i.stock ?? 0 }));
              })()
            }
              renderActions={(row) => (
                <>
                  <Button size="sm" className="rounded-full" variant="secondary" onClick={() => editItem(row.id)}>Edit</Button>
                  <Button size="sm" className="rounded-full" variant="destructive" onClick={() => deleteItem(row.id)}>Delete</Button>
                </>
              )}
           />
           {/* pagination controls */}
           <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
             <div className="text-sm text-muted-foreground">Showing {Math.min((currentPage - 1) * pageSize + 1, filteredItems.length || 0)} - {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length}</div>
             <div className="flex items-center gap-2">
               <Button size="sm" className="rounded-full" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
               {Array.from({ length: Math.max(1, Math.ceil(filteredItems.length / pageSize)) }).map((_, i) => (
                 <Button key={i} size="sm" className="rounded-full" variant={currentPage === i + 1 ? 'secondary' : 'ghost'} onClick={() => setCurrentPage(i + 1)}>
                   {i + 1}
                 </Button>
               ))}
               <Button size="sm" className="rounded-full" onClick={() => setCurrentPage(p => Math.min(Math.max(1, Math.ceil(filteredItems.length / pageSize)), p + 1))} disabled={currentPage === Math.max(1, Math.ceil(filteredItems.length / pageSize))}>Next</Button>
             </div>
           </div>
           {/* Edit / Add dialog */}
           <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
             <DialogContent className="panel-surface max-w-3xl border-0 p-0 shadow-[var(--shadow-elegant)]">
               <DialogHeader>
                 <div className="border-b border-border/70 px-5 py-4 sm:px-6">
                   <DialogTitle className="font-display text-2xl font-semibold tracking-tight">{editingId ? 'Edit inventory item' : 'Add new inventory item'}</DialogTitle>
                   <DialogDescription className="mt-1">{editingId ? 'Update fields and click Update to save changes.' : 'Enter the item details and click Save to add the item.'}</DialogDescription>
                 </div>
               </DialogHeader>
                <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
                 <div className="grid gap-2">
                   <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Name</label>
                   <input className="rounded-2xl border border-border/80 bg-card px-4 py-3" value={name} onChange={e=>setName(e.target.value)} />
                 </div>
                 <div className="grid gap-2">
                   <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">SKU</label>
                   <input className="rounded-2xl border border-border/80 bg-card px-4 py-3" value={sku} onChange={e=>setSku(e.target.value)} />
                 </div>
                 <div className="grid gap-2">
                   <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Price</label>
                   <input type="number" className="rounded-2xl border border-border/80 bg-card px-4 py-3" value={price as any} onChange={e=>setPrice(e.target.valueAsNumber ?? '')} />
                 </div>
                 <div className="grid gap-2">
                   <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Stock</label>
                   <input type="number" className="rounded-2xl border border-border/80 bg-card px-4 py-3" value={stock as any} onChange={e=>setStock(e.target.valueAsNumber ?? '')} />
                 </div>
                 <div className="sm:col-span-2 grid gap-2">
                   <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Description</label>
                   <textarea className="min-h-28 rounded-2xl border border-border/80 bg-card px-4 py-3" value={description} onChange={e=>setDescription(e.target.value)} />
                 </div>
               </div>
               <DialogFooter className="border-t border-border/70 px-5 py-4 sm:px-6">
                 <div className="flex items-center justify-between gap-4 w-full">
                   <div>
                     <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Preview price</div>
                     <div className="text-lg font-semibold text-foreground">{typeof price === 'number' ? formatMoney(price) : '$0.00'}</div>
                   </div>
                   <div className="flex gap-2">
                     <Button className="rounded-full" variant="hero" onClick={async () => { await saveItem(); setEditDialogOpen(false); }}>{editingId ? 'Update' : 'Save'}</Button>
                     <Button className="rounded-full" variant="ghost" onClick={() => { setEditDialogOpen(false); }}>Cancel</Button>
                   </div>
                 </div>
               </DialogFooter>
              </DialogContent>
            </Dialog>
           </section>
         </div>
       </AppShell>
     );
   }
   
   export default Inventory;
