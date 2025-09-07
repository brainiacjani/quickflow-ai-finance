import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DataTable from "@/components/dashboard/DataTable";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

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
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredCustomers = (customers || []).filter(c => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return true;
    const name = (c.name || '').toString().toLowerCase();
    const phone = (c.phone || '').toString().toLowerCase();
    return name.includes(q) || phone.includes(q);
  });

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
  };

  return (
    <AppShell>
      <Helmet><title>Customers | QuickFlow</title></Helmet>
      <div className="container py-8 grid gap-8">
        <section className="grid gap-4">
          <h1 className="text-2xl font-semibold">Customers</h1>
          <div className="pt-2">
            <input
              className="w-full rounded-md border bg-background px-3 py-2 mb-3"
              placeholder="Search customers by name or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <div className="flex items-center gap-2">
            <Button variant="hero" onClick={saveCustomer}>{editingId ? 'Update customer' : 'Save customer'}</Button>
            {editingId && (
              <Button variant="ghost" onClick={() => { setEditingId(null); setName(''); setEmail(''); setPhone(''); setAddress(''); }}>Cancel</Button>
            )}
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-semibold">All customers</h2>
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
             columns={[
               { key: 'name', label: 'Name', bold: true },
               { key: 'email', label: 'Email' },
               { key: 'phone', label: 'Phone' },
               { key: 'address', label: 'Address' },
             ]}
            data={filteredCustomers.map(c => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, address: c.address }))}
             renderActions={(row) => (
               <>
                 <Button size="sm" variant="secondary" onClick={() => editCustomer(row.id)}>Edit</Button>
                 <Button size="sm" variant="destructive" onClick={() => deleteCustomer(row.id)}>Delete</Button>
               </>
             )}
           />
        </section>
      </div>
    </AppShell>
  );
};

export default Customers;
