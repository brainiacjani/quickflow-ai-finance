import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/dashboard/DataTable";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const Vendors = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  // pagination for vendors
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredVendors = (vendors || []).filter(v => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return true;
    const name = (v.name || '').toString().toLowerCase();
    const phone = (v.phone || '').toString().toLowerCase();
    return name.includes(q) || phone.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / pageSize));
  const paginatedVendors = filteredVendors.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, vendors.length]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      if (!user?.id) { setVendors([]); return; }
      let q = supabase.from('vendors').select('*').order('created_at', { ascending: false });
      const isAdmin = Boolean((profile as any)?.is_admin || user?.user_metadata?.role === 'admin');
      if (!isAdmin) q = q.eq('created_by', user?.id);
      const { data, error } = await q;
      if (error) throw error;
      setVendors(data ?? []);
    } catch (e) {
      console.error('fetchVendors error', e);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchVendors(); }, [user?.id, profile]);

  const saveVendor = async () => {
    try {
      if (editingId) {
        const payload = { name, email: email || null, phone: phone || null, address: address || null };
        const { error } = await supabase.from('vendors').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const payload = { name, email: email || null, phone: phone || null, address: address || null, created_by: user?.id ?? null };
        const { error } = await supabase.from('vendors').insert(payload);
        if (error) throw error;
      }
      setName(''); setEmail(''); setPhone(''); setAddress(''); setEditingId(null);
      fetchVendors();
    } catch (e) {
      console.error('saveVendor error', e);
      alert('Failed to save vendor');
    }
  };

  const deleteVendor = async (id: string) => {
    if (!confirm('Delete this vendor?')) return;
    try {
      const { error } = await supabase.from('vendors').delete().eq('id', id);
      if (error) throw error;
      fetchVendors();
    } catch (e) {
      console.error('deleteVendor error', e);
      alert('Failed to delete vendor');
    }
  };

  const editVendor = (id: string) => {
    const v = vendors.find((x) => x.id === id);
    if (!v) return;
    setEditingId(id);
    setName(v.name || '');
    setEmail(v.email || '');
    setPhone(v.phone || '');
    setAddress(v.address || '');
    setEditDialogOpen(true);
  };

  return (
    <AppShell>
      <Helmet><title>Vendors | QuickFlow</title></Helmet>
      <div className="container py-8 grid gap-8">
        <section className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Vendors</h1>
          <div>
            <Button variant="hero" onClick={() => { setEditingId(null); setName(''); setEmail(''); setPhone(''); setAddress(''); setEditDialogOpen(true); }}>Add New</Button>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="pt-2">
            <input
              className="w-full rounded-md border bg-background px-3 py-2 mb-3"
              placeholder="Search vendors by name or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DataTable
              title="Vendors"
              isLoading={loading}
              columns={[
                { key: 'name', label: 'Name', bold: true },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'address', label: 'Address' },
              ]}
            data={paginatedVendors.map(c => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address }))}
              renderActions={(row) => (
                <>
                  <Button size="sm" variant="secondary" onClick={() => editVendor(row.id)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteVendor(row.id)}>Delete</Button>
                </>
              )}
            />
          {/* edit dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit vendor' : 'Add New vendor'}</DialogTitle>
                <DialogDescription>{editingId ? 'Update the vendor details and click Update to save changes.' : 'Enter the new vendor details and click Save to add the vendor.'}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="grid gap-2">
                  <label className="text-sm">Name</label>
                  <input className="rounded-md border bg-background px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm">Email</label>
                  <input className="rounded-md border bg-background px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm">Phone</label>
                  <input className="rounded-md border bg-background px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} />
                </div>
                <div className="sm:col-span-2 grid gap-2">
                  <label className="text-sm">Address</label>
                  <textarea className="rounded-md border bg-background px-3 py-2" value={address} onChange={e=>setAddress(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <div className="flex gap-2">
                  <Button variant="hero" onClick={async () => { await saveVendor(); setEditDialogOpen(false); }}>{editingId ? 'Update' : 'Save'}</Button>
                  <Button variant="ghost" onClick={() => { setEditDialogOpen(false); }}>Cancel</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
         </section>
       </div>
     </AppShell>
  );
};

export default Vendors;
