import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/dashboard/DataTable";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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
      <div className="container py-8 grid gap-8">
        <section className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <div>
            <Button variant="hero" onClick={() => { setEditingId(null); setName(''); setSku(''); setPrice(''); setStock(''); setDescription(''); setEditDialogOpen(true); }}>Add New</Button>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All items</h2>
            <div className="w-72">
              <input className="w-full rounded-md border bg-background px-3 py-2" placeholder="Search by name or SKU" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
                  <Button size="sm" variant="secondary" onClick={() => editItem(row.id)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteItem(row.id)}>Delete</Button>
                </>
              )}
           />
           {/* pagination controls */}
           <div className="flex items-center justify-between mt-3">
             <div className="text-sm text-muted-foreground">Showing {Math.min((currentPage - 1) * pageSize + 1, filteredItems.length || 0)} - {Math.min(currentPage * pageSize, filteredItems.length)} of {filteredItems.length}</div>
             <div className="flex items-center gap-2">
               <Button size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
               {Array.from({ length: Math.max(1, Math.ceil(filteredItems.length / pageSize)) }).map((_, i) => (
                 <Button key={i} size="sm" variant={currentPage === i + 1 ? 'secondary' : 'ghost'} onClick={() => setCurrentPage(i + 1)}>
                   {i + 1}
                 </Button>
               ))}
               <Button size="sm" onClick={() => setCurrentPage(p => Math.min(Math.max(1, Math.ceil(filteredItems.length / pageSize)), p + 1))} disabled={currentPage === Math.max(1, Math.ceil(filteredItems.length / pageSize))}>Next</Button>
             </div>
           </div>
           {/* Edit / Add dialog */}
           <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>{editingId ? 'Edit inventory item' : 'Add New inventory item'}</DialogTitle>
                 <DialogDescription>{editingId ? 'Update fields and click Update to save changes.' : 'Enter the item details and click Save to add the item.'}</DialogDescription>
               </DialogHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                 <div className="grid gap-2">
                   <label className="text-sm">Name</label>
                   <input className="rounded-md border bg-background px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />
                 </div>
                 <div className="grid gap-2">
                   <label className="text-sm">SKU</label>
                   <input className="rounded-md border bg-background px-3 py-2" value={sku} onChange={e=>setSku(e.target.value)} />
                 </div>
                 <div className="grid gap-2">
                   <label className="text-sm">Price</label>
                   <input type="number" className="rounded-md border bg-background px-3 py-2" value={price as any} onChange={e=>setPrice(e.target.valueAsNumber ?? '')} />
                 </div>
                 <div className="grid gap-2">
                   <label className="text-sm">Stock</label>
                   <input type="number" className="rounded-md border bg-background px-3 py-2" value={stock as any} onChange={e=>setStock(e.target.valueAsNumber ?? '')} />
                 </div>
                 <div className="sm:col-span-2 grid gap-2">
                   <label className="text-sm">Description</label>
                   <textarea className="rounded-md border bg-background px-3 py-2" value={description} onChange={e=>setDescription(e.target.value)} />
                 </div>
               </div>
               <DialogFooter>
                 <div className="flex gap-2">
                   <Button variant="hero" onClick={async () => { await saveItem(); setEditDialogOpen(false); }}>{editingId ? 'Update' : 'Save'}</Button>
                   <Button variant="ghost" onClick={() => { setEditDialogOpen(false); }}>Cancel</Button>
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
