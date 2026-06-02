import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/dashboard/DataTable';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import RequireRole from '@/components/auth/RequireRole';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [eFirst, setEFirst] = useState('');
  const [eLast, setELast] = useState('');
  const [eDisplay, setEDisplay] = useState('');
  const [eEmail, setEEmail] = useState('');
  const [eRole, setERole] = useState('');
  const [eIsAdmin, setEIsAdmin] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('id,email,display_name,first_name,last_name,role,is_admin,created_at').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data ?? []);
    } catch (e: any) {
      console.error('fetchUsers error', e);
      toast({ title: 'Failed to load users', description: e?.message || String(e) });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleAdmin = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_admin: !current }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Updated', description: 'User admin flag updated.' });
      await fetchUsers();
    } catch (e) {
      console.error('toggleAdmin error', e);
      toast({ title: 'Update failed', description: 'Unable to update user.' });
    }
  };

  const setRole = async (id: string, role: string) => {
    try {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Updated', description: 'User role updated.' });
      await fetchUsers();
    } catch (e) {
      console.error('setRole error', e);
      toast({ title: 'Update failed', description: 'Unable to update user.' });
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Delete user and profile? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'User removed.' });
      await fetchUsers();
    } catch (e) {
      console.error('deleteUser error', e);
      toast({ title: 'Delete failed', description: 'Unable to delete user.' });
    }
  };

  // Try to fetch the user's email from the auth.users table and persist it into profiles.email
  const syncEmail = async (id: string) => {
    try {
      toast({ title: 'Syncing', description: 'Attempting to sync email from auth system...' });
      // Try to read from auth.users; this may require DB policies that allow the client to read auth.users
      const { data: authUser, error: authErr } = await supabase.from('auth.users').select('id,email').eq('id', id).maybeSingle();
      if (authErr) {
        console.warn('auth.users read failed', authErr);
        toast({ title: 'Sync failed', description: 'Unable to read from auth.users (permissions).' });
        return;
      }

      if (!authUser || !authUser.email) {
        toast({ title: 'No email found', description: 'Auth system has no email for this user.' });
        return;
      }

      const { error } = await supabase.from('profiles').update({ email: authUser.email }).eq('id', id);
      if (error) throw error;

      toast({ title: 'Synced', description: 'Email copied to profiles table.' });
      await fetchUsers();
    } catch (e: any) {
      console.error('syncEmail error', e);
      toast({ title: 'Sync failed', description: e?.message || String(e) });
    }
  };

  const openEdit = (row: any) => {
    setEditingUser(row);
    setEFirst(row.display_name || row.first_name || '');
    // try to split display into first/last if available
    const names = (row.display_name || '').split(' ');
    setEFirst(row.first_name ?? names[0] ?? '');
    setELast(row.last_name ?? (names.length > 1 ? names.slice(1).join(' ') : ''));
    setEDisplay(row.display_name ?? `${row.first_name || ''} ${row.last_name || ''}`.trim());
    setEEmail(row.email ?? '');
    setERole(row.role ?? 'user');
    setEIsAdmin(row.is_admin === 'Yes' || row.is_admin === true);
    setEditOpen(true);
  };

  const saveUser = async () => {
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      const payload: any = {
        display_name: eDisplay || null,
        first_name: eFirst || null,
        last_name: eLast || null,
        role: eRole || null,
        is_admin: eIsAdmin || false,
        email: eEmail || null,
      };
      const { error } = await supabase.from('profiles').update(payload).eq('id', editingUser.id);
      if (error) throw error;
      toast({ title: 'Saved', description: 'User updated.' });
      setEditOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (e: any) {
      console.error('saveUser error', e);
      toast({ title: 'Save failed', description: e?.message || String(e) });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <RequireRole roles={["admin"]}>
      <AppShell>
        <Helmet>
          <title>Admin | QuickFlow</title>
        </Helmet>
        <div className="grid gap-6 py-8">
          <section className="panel-surface grid-muted relative overflow-hidden rounded-[2rem] px-6 py-6 sm:px-8 sm:py-7">
            <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(67,56,202,0.12),transparent_55%)] lg:block" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Admin controls
                </div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Admin</h1>
                <p className="mt-2 max-w-xl text-base text-muted-foreground">
                  Review user accounts, roles, and admin access with the same consistent table and dialog treatment used across the workspace.
                </p>
              </div>
              <div className="flex gap-2">
                <div className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-sm text-foreground/80">{users.length} users</div>
                <Button className="rounded-full" onClick={fetchUsers}>Refresh</Button>
              </div>
            </div>
          </section>

          <DataTable
            title="Users"
            columns={[
              { key: 'display_name', label: 'Name', bold: true },
              { key: 'email', label: 'Email' },
              { key: 'role', label: 'Role' },
              { key: 'is_admin', label: 'Admin' },
            ]}
            data={users.map(u => ({
              id: u.id,
              display_name: u.display_name || u.first_name || u.email,
              email: u.email || null,
              role: u.role || 'user',
              is_admin: u.is_admin ? 'Yes' : 'No',
            }))}
            renderActions={(row) => (
              <>
                <Button size="sm" className="rounded-full" variant="ghost" onClick={() => openEdit(row)}>Edit</Button>
                {!row.email && (
                  <Button size="sm" className="rounded-full" variant="ghost" onClick={() => syncEmail(row.id)}>Sync email</Button>
                )}
                <Button size="sm" className="rounded-full" variant="outline" onClick={() => toggleAdmin(row.id, row.is_admin === 'Yes')}>{row.is_admin === 'Yes' ? 'Revoke' : 'Make admin'}</Button>
                <Button size="sm" className="rounded-full" onClick={() => setRole(row.id, row.role === 'admin' ? 'user' : 'admin')}>{row.role === 'admin' ? 'Demote' : 'Promote'}</Button>
                <Button size="sm" className="rounded-full" variant="destructive" onClick={() => deleteUser(row.id)}>Delete</Button>
              </>
            )}
          />

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="panel-surface max-w-3xl border-0 p-0 shadow-[var(--shadow-elegant)]">
              <div>
                <div className="border-b border-border/70 px-5 py-4 sm:px-6">
                  <DialogTitle className="font-display text-2xl font-semibold tracking-tight">Edit user</DialogTitle>
                  <DialogDescription className="mt-1">Update user profile details stored in the profiles table.</DialogDescription>
                </div>

                <div className="grid gap-3 px-5 py-5 sm:px-6">
                  <div className="grid gap-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">First name</label>
                    <Input className="rounded-2xl border-border/80 bg-card px-4 py-3" value={eFirst} onChange={(e:any) => setEFirst(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Last name</label>
                    <Input className="rounded-2xl border-border/80 bg-card px-4 py-3" value={eLast} onChange={(e:any) => setELast(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Display name</label>
                    <Input className="rounded-2xl border-border/80 bg-card px-4 py-3" value={eDisplay} onChange={(e:any) => setEDisplay(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Email</label>
                    <Input className="rounded-2xl border-border/80 bg-card px-4 py-3" value={eEmail} onChange={(e:any) => setEEmail(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Role</label>
                    <Input className="rounded-2xl border-border/80 bg-card px-4 py-3" value={eRole} onChange={(e:any) => setERole(e.target.value)} placeholder="user | admin" />
                  </div>
                  <div className="flex items-center gap-2 rounded-[1.25rem] bg-secondary/35 px-4 py-3">
                    <input id="isAdmin" type="checkbox" checked={eIsAdmin} onChange={(ev) => setEIsAdmin((ev.target as HTMLInputElement).checked)} />
                    <label htmlFor="isAdmin" className="text-sm">Is admin</label>
                  </div>

                  <div className="mt-4 flex justify-end gap-2 border-t border-border/70 pt-4">
                    <Button className="rounded-full" variant="outline" onClick={() => { setEditOpen(false); setEditingUser(null); }}>Cancel</Button>
                    <Button className="rounded-full" onClick={saveUser} disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save'}</Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AppShell>
    </RequireRole>
  );
};

export default Admin;
