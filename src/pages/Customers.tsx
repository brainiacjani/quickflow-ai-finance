import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/dashboard/DataTable";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const Customers = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  // pagination for customers
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredCustomers = (customers || []).filter(c => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return true;
    const name = (c.name || '').toString().toLowerCase();
    const phone = (c.phone || '').toString().toLowerCase();
    return name.includes(q) || phone.includes(q);
  });

  // paginated view of filtered customers
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize);

  // reset page when search or data changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery, customers.length]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      let q = supabase.from('customers').select('*').order('created_at', { ascending: false });
      // If not admin, only show customers created by the current user
      const isAdmin = Boolean((profile as any)?.is_admin || user?.user_metadata?.role === 'admin');
      if (!isAdmin) q = q.eq('created_by', user?.id);
      const { data, error } = await q;
      if (error) throw error;
      setCustomers(data ?? []);
    } catch (e) {
      console.error('fetchCustomers error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [user?.id]);

  const saveCustomer = async () => {
    try {
      if (editingId) {
        // update existing
        const payload = { name, email: email || null, phone: phone || null, address: address || null };
        const { error } = await supabase.from('customers').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const payload = { name, email: email || null, phone: phone || null, address: address || null, created_by: user?.id ?? null };
        const { error } = await supabase.from('customers').insert(payload);
        if (error) throw error;
      }
      setName(''); setEmail(''); setPhone(''); setAddress(''); setEditingId(null);
      fetchCustomers();
    } catch (e) {
      console.error('saveCustomer error', e);
      alert('Failed to save customer');
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      fetchCustomers();
    } catch (e) {
      console.error('deleteCustomer error', e);
      alert('Failed to delete customer');
    }
  };

  const editCustomer = (id: string) => {
    const c = customers.find((x) => x.id === id);
    if (!c) return;
    setEditingId(id);
    setName(c.name || '');
    setEmail(c.email || '');
    setPhone(c.phone || '');
    setAddress(c.address || '');
    // scroll to top of form for convenience
    const el = document.querySelector('.container');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setEditDialogOpen(true);
  };

  return (
    <AppShell>
      <Helmet><title>Customers | QuickFlow</title></Helmet>
      <div className="container py-8 grid gap-8">
        <section className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Customers</h1>
          <div>
            <Button variant="hero" onClick={() => { setEditingId(null); setName(''); setEmail(''); setPhone(''); setAddress(''); setEditDialogOpen(true); }}>Add New</Button>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="pt-2">
            <input
              className="w-full rounded-md border bg-background px-3 py-2 mb-3"
              placeholder="Search customers by name or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DataTable
              title="Customers"
              isLoading={loading}
              columns={[
                { key: 'name', label: 'Name', bold: true },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'address', label: 'Address' },
              ]}
            data={paginatedCustomers.map(c => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address }))}
              renderActions={(row) => (
                <>
                  <Button size="sm" variant="secondary" onClick={() => editCustomer(row.id)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteCustomer(row.id)}>Delete</Button>
                </>
              )}
            />
          {/* edit dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit customer' : 'Add New customer'}</DialogTitle>
                <DialogDescription>{editingId ? 'Update the customer details and click Update to save changes.' : 'Enter the new customer details and click Save to add the customer.'}</DialogDescription>
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
                  <Button variant="hero" onClick={async () => { await saveCustomer(); setEditDialogOpen(false); }}>{editingId ? 'Update' : 'Save'}</Button>
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
 
 export default Customers;
