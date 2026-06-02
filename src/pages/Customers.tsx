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

const customerFormDefaults = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

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
      <div className="grid gap-8 py-8">
        <section className="panel-surface grid-muted relative overflow-hidden rounded-[2rem] px-6 py-6 sm:px-8 sm:py-7">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.12),transparent_55%)] lg:block" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Relationship management
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Customers</h1>
              <p className="mt-2 max-w-xl text-base text-muted-foreground">Keep customer records clean, searchable, and visually aligned with the rest of the workspace.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <div className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-sm text-foreground/80">{filteredCustomers.length} customer records</div>
              </div>
            </div>
            <div>
              <Button variant="hero" className="rounded-full" onClick={() => { setEditingId(null); setName(customerFormDefaults.name); setEmail(customerFormDefaults.email); setPhone(customerFormDefaults.phone); setAddress(customerFormDefaults.address); setEditDialogOpen(true); }}>Add New</Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">Customer directory</h2>
            <p className="mt-1 text-sm text-muted-foreground">Search and manage billing contacts with the same table and modal treatment used across the app.</p>
          </div>
          <div className="pt-2">
            <input
              className="mb-3 w-full rounded-2xl border border-border/80 bg-card px-4 py-3 shadow-sm"
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
                  <Button size="sm" className="rounded-full" variant="secondary" onClick={() => editCustomer(row.id)}>Edit</Button>
                  <Button size="sm" className="rounded-full" variant="destructive" onClick={() => deleteCustomer(row.id)}>Delete</Button>
                </>
              )}
            />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            <Button size="sm" className="rounded-full" variant="ghost" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>Prev</Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const p = idx + 1;
                return (
                  <Button key={p} size="sm" className="rounded-full" variant={p === currentPage ? 'default' : 'ghost'} onClick={() => setCurrentPage(p)}>{p}</Button>
                );
              })}
            </div>
            <Button size="sm" className="rounded-full" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>Next</Button>
          </div>
          {/* edit dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="panel-surface max-w-3xl border-0 p-0 shadow-[var(--shadow-elegant)]">
              <DialogHeader>
                <div className="border-b border-border/70 px-5 py-4 sm:px-6">
                  <DialogTitle className="font-display text-2xl font-semibold tracking-tight">{editingId ? 'Edit customer' : 'Add new customer'}</DialogTitle>
                  <DialogDescription className="mt-1">{editingId ? 'Update the customer details and click Update to save changes.' : 'Enter the new customer details and click Save to add the customer.'}</DialogDescription>
                </div>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Name</label>
                  <input className="rounded-2xl border border-border/80 bg-card px-4 py-3" value={name} onChange={e=>setName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Email</label>
                  <input className="rounded-2xl border border-border/80 bg-card px-4 py-3" value={email} onChange={e=>setEmail(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Phone</label>
                  <input className="rounded-2xl border border-border/80 bg-card px-4 py-3" value={phone} onChange={e=>setPhone(e.target.value)} />
                </div>
                <div className="sm:col-span-2 grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Address</label>
                  <textarea className="min-h-28 rounded-2xl border border-border/80 bg-card px-4 py-3" value={address} onChange={e=>setAddress(e.target.value)} />
                </div>
              </div>
              <DialogFooter className="border-t border-border/70 px-5 py-4 sm:px-6">
                <div className="flex gap-2">
                  <Button className="rounded-full" variant="hero" onClick={async () => { await saveCustomer(); setEditDialogOpen(false); }}>{editingId ? 'Update' : 'Save'}</Button>
                  <Button className="rounded-full" variant="ghost" onClick={() => { setEditDialogOpen(false); }}>Cancel</Button>
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
