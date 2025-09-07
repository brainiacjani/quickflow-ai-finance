import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/dashboard/DataTable";
import { useAuth } from "@/contexts/AuthContext";

const Inventory = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [description, setDescription] = useState("");

  const fetchItems = async () => {
    try {
      setLoading(true);
      let q = supabase.from('inventory').select('*').order('created_at', { ascending: false });
      if (!user?.id) { setItems([]); return; }
      // no admin filter for now; will respect created_by later if needed
      const { data, error } = await q;
      if (error) throw error;
      setItems(data ?? []);
    } catch (e) {
      console.error('fetchItems error', e);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [user?.id]);

  const saveItem = async () => {
    try {
      const payload = { name, sku: sku || null, price: price === "" ? null : price, stock: Number(stock) || 0, description: description || null, created_by: user?.id ?? null };
      const { error } = await supabase.from('inventory').insert(payload);
      if (error) throw error;
      setName(''); setSku(''); setPrice(''); setStock(''); setDescription('');
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

  return (
    <AppShell>
      <Helmet><title>Inventory | QuickFlow</title></Helmet>
      <div className="container py-8 grid gap-8">
        <section className="grid gap-4">
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <div>
            <Button variant="hero" onClick={saveItem}>Save item</Button>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-semibold">All items</h2>
          <DataTable
            title="Inventory"
            columns={[
              { key: 'name', label: 'Name', bold: true },
              { key: 'sku', label: 'SKU' },
              { key: 'price', label: 'Price' },
              { key: 'stock', label: 'Stock' },
            ]}
            data={items.map(i => ({ id: i.id, name: i.name, sku: i.sku, price: i.price ? `$${Number(i.price).toFixed(2)}` : '-', stock: i.stock ?? 0 }))}
            renderActions={(row) => (
              <>
                <Button size="sm" variant="destructive" onClick={() => deleteItem(row.id)}>Delete</Button>
              </>
            )}
          />
        </section>
      </div>
    </AppShell>
  );
};

export default Inventory;
