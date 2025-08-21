import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AppShell } from "@/components/layout/AppShell";

const roleOptions = ["user", "viewer", "admin"];
const availableReports = ['invoices','expenses','reports'];
const availablePages = ['invoices','expenses','reports'];

const AdminPage = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [reportForm, setReportForm] = useState({ name: '', description: '', query: '', access: [] as string[] });

  // current signed-in user's profile (to optionally control admin-only actions)
  const { data: currentProfile } = useProfile();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', display_name: '', email: '', avatar_url: '', role: 'user', is_active: true, is_admin: false, page_access: [] as string[], report_access: [] as string[] });

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      setProfiles(data ?? []);
    } catch (e) {
      console.error('fetchProfiles error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const updateProfile = async (id: string, patch: Record<string, any>) => {
    setSavingId(id);
    try {
      const { error } = await supabase.from('profiles').update(patch).eq('id', id);
      if (error) throw error;
      await fetchProfiles();
    } catch (e) {
      console.error('updateProfile error', e);
    } finally {
      setSavingId(null);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setReports(data ?? []);
    } catch (e) {
      console.error('fetchReports error', e);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Persist page_access for a profile using the latest local state
  const savePageAccess = async (id: string) => {
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;
    const pages = Array.isArray(profile.page_access) ? profile.page_access : (profile.page_access ? JSON.parse(profile.page_access) : []);
    await updateProfile(id, { page_access: JSON.stringify(pages) });
  };

  const saveReport = async () => {
    try {
      if (editingReport) {
        const { error } = await supabase.from('reports').update(reportForm).eq('id', editingReport.id);
        if (error) throw error;
      } else {
        const payload = { ...reportForm, access: JSON.stringify(reportForm.access) };
        const { error } = await supabase.from('reports').insert(payload);
        if (error) throw error;
      }
      setReportModalOpen(false);
      setEditingReport(null);
      setReportForm({ name: '', description: '', query: '', access: [] });
      await fetchReports();
    } catch (e) {
      console.error('saveReport error', e);
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase.from('reports').delete().eq('id', id);
      if (error) throw error;
      await fetchReports();
    } catch (e) {
      console.error('deleteReport error', e);
    }
  };

  const openEditProfile = (p: any) => {
    setEditingProfile(p);
    setEditForm({
      first_name: p.first_name ?? '',
      last_name: p.last_name ?? '',
      display_name: p.display_name ?? '',
      email: p.email ?? '',
      avatar_url: p.avatar_url ?? '',
      role: p.role ?? 'user',
      is_active: p.is_active ?? true,
      is_admin: p.is_admin === true,
      page_access: Array.isArray(p.page_access) ? p.page_access : (p.page_access ? JSON.parse(p.page_access) : []),
      report_access: Array.isArray(p.report_access) ? p.report_access : (p.report_access ? JSON.parse(p.report_access) : []),
    });
    setEditModalOpen(true);
  };

  const saveEditedProfile = async () => {
    if (!editingProfile) return;
    const patch: Record<string, any> = {
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      display_name: editForm.display_name,
      avatar_url: editForm.avatar_url,
      role: editForm.role,
      is_active: editForm.is_active,
      is_admin: editForm.is_admin,
      page_access: JSON.stringify(editForm.page_access),
      report_access: JSON.stringify(editForm.report_access),
    };
    await updateProfile(editingProfile.id, patch);
    setEditModalOpen(false);
    setEditingProfile(null);
  };

  const deleteProfile = async (id: string) => {
    if (!confirm('Delete this profile? This will remove the profile row but will not remove the auth user.')) return;
    setSavingId(id);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      await fetchProfiles();
    } catch (e) {
      console.error('deleteProfile error', e);
    } finally {
      setSavingId(null);
    }
  };

  if (!user) return null;

  return (
    <RequireAuth>
      <AppShell>
        <div className="container py-10">
          <Helmet>
            <title>Admin · QuickFlow</title>
          </Helmet>

          <h1 className="text-2xl font-bold mb-6">Admin — User Management</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>View and manage user roles and report access</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>Loading users…</div>
              ) : (
                <div className="space-y-4">
                  {profiles.map((p) => {
                    const reports = Array.isArray(p.report_access) ? p.report_access : (p.report_access ? JSON.parse(p.report_access) : []);
                    const isAdminFlag = p?.is_admin === true;
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-4 p-3 border rounded">
                        <div className="flex-1">
                          <div className="font-medium">{p.first_name ? `${p.first_name} ${p.last_name ?? ''}`.trim() : p.display_name ?? p.email ?? p.id}</div>
                          <div className="text-sm text-muted-foreground">{p.email ?? ''}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={isAdminFlag}
                              onChange={async (ev) => {
                                await updateProfile(p.id, { is_admin: ev.target.checked });
                              }}
                            />
                            <span>Admin</span>
                          </label>

                          {/* Page-level access controls (pages the user can see) */}
                          <div className="flex items-center gap-2">
                            {availablePages.map((page) => (
                              <label key={page} className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={Array.isArray(p.page_access) ? p.page_access.includes(page) : (p.page_access ? JSON.parse(p.page_access).includes(page) : false)}
                                  onChange={async (ev) => {
                                    const checked = ev.target.checked;
                                    const current = Array.isArray(p.page_access) ? p.page_access : (p.page_access ? JSON.parse(p.page_access) : []);
                                    const next = checked ? Array.from(new Set([...current, page])) : current.filter((x: string) => x !== page);
                                    // optimistic update so checkbox toggles immediately
                                    setProfiles((prev) => prev.map((pr) => (pr.id === p.id ? { ...pr, page_access: next } : pr)));
                                    try {
                                      await updateProfile(p.id, { page_access: JSON.stringify(next) });
                                    } catch (e) {
                                      // revert if update fails
                                      await fetchProfiles();
                                    }
                                  }}
                                />
                                <span className="capitalize">{page}</span>
                              </label>
                            ))}
                          </div>

                          {/* Report access (existing) */}
                          <div className="flex items-center gap-2">
                            {availableReports.map((r) => (
                              <label key={r} className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={reports.includes(r)}
                                  onChange={async (ev) => {
                                    const checked = ev.target.checked;
                                    const currentReports = Array.isArray(p.report_access) ? p.report_access : (p.report_access ? JSON.parse(p.report_access) : []);
                                    const next = checked ? Array.from(new Set([...currentReports, r])) : currentReports.filter((x: string) => x !== r);
                                    // optimistic update
                                    setProfiles((prev) => prev.map((pr) => (pr.id === p.id ? { ...pr, report_access: next } : pr)));
                                    try {
                                      await updateProfile(p.id, { report_access: JSON.stringify(next) });
                                    } catch (e) {
                                      await fetchProfiles();
                                    }
                                  }}
                                />
                                <span className="capitalize">{r}</span>
                              </label>
                            ))}
                          </div>

                          {/* Row actions: Edit, Delete, Save page access */}
                          <div className="flex items-center gap-2">
                            <Button size="sm" onClick={() => openEditProfile(p)} disabled={savingId === p.id}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteProfile(p.id)} disabled={savingId === p.id}>Delete</Button>
                            <Button size="sm" disabled={savingId === p.id} onClick={() => savePageAccess(p.id)}>
                              {savingId === p.id ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reports Designer</CardTitle>
              <CardDescription>Design custom reports and assign access (placeholder)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">This is a starting UI for creating reports. You can store report definitions in a `reports` table and assign access to users via their `report_access` field.</p>
              <div className="mb-4">
                <div className="flex gap-2 mb-3">
                  <Button onClick={() => { setReportModalOpen(true); setEditingReport(null); }}>Create Report</Button>
                  <Button variant="outline" onClick={fetchReports}>Refresh</Button>
                </div>

                <div className="space-y-3">
                  {reports.map(r => (
                    <div key={r.id} className="p-3 border rounded flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-sm text-muted-foreground">{r.description}</div>
                        <div className="mt-2 text-xs text-muted-foreground">Access: {(Array.isArray(r.access) ? r.access.join(', ') : (r.access ? JSON.parse(r.access).join(', ') : 'None'))}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" onClick={() => { setEditingReport(r); setReportForm({ name: r.name, description: r.description, query: r.query, access: Array.isArray(r.access) ? r.access : (r.access ? JSON.parse(r.access) : []) }); setReportModalOpen(true); }}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteReport(r.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
                <DialogContent>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{editingReport ? 'Edit Report' : 'Create Report'}</h3>
                    <div className="grid gap-2">
                      <Label>Name</Label>
                      <Input value={reportForm.name} onChange={(e) => setReportForm(s => ({ ...s, name: e.target.value }))} />
                      <Label>Description</Label>
                      <Input value={reportForm.description} onChange={(e) => setReportForm(s => ({ ...s, description: e.target.value }))} />
                      <Label>SQL Query</Label>
                      <textarea className="w-full h-40 rounded border p-2" value={reportForm.query} onChange={(e) => setReportForm(s => ({ ...s, query: e.target.value }))} />
                      <Label>Access (roles or user ids, comma separated)</Label>
                      <Input value={reportForm.access.join(',')} onChange={(e) => setReportForm(s => ({ ...s, access: e.target.value.split(',').map(x => x.trim()).filter(Boolean) }))} />
                      <div className="flex gap-2 mt-3">
                        <Button onClick={saveReport}>{editingReport ? 'Save' : 'Create'}</Button>
                        <Button variant="outline" onClick={() => setReportModalOpen(false)}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">Edit Profile</h3>
                    <div className="grid gap-2">
                      <Label>First name</Label>
                      <Input value={editForm.first_name} onChange={(e) => setEditForm(s => ({ ...s, first_name: e.target.value }))} />
                      <Label>Last name</Label>
                      <Input value={editForm.last_name} onChange={(e) => setEditForm(s => ({ ...s, last_name: e.target.value }))} />
                      <Label>Display name</Label>
                      <Input value={editForm.display_name} onChange={(e) => setEditForm(s => ({ ...s, display_name: e.target.value }))} />
                      <Label>Avatar URL</Label>
                      <Input value={editForm.avatar_url} onChange={(e) => setEditForm(s => ({ ...s, avatar_url: e.target.value }))} />
                      <Label>Role</Label>
                      <select value={editForm.role} onChange={(e) => setEditForm(s => ({ ...s, role: e.target.value }))} className="rounded border px-2 py-1">
                        {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={editForm.is_admin} onChange={(e) => setEditForm(s => ({ ...s, is_admin: e.target.checked }))} /> Admin</label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm(s => ({ ...s, is_active: e.target.checked }))} /> Active</label>

                      <div className="flex gap-2 mt-3">
                        <Button onClick={saveEditedProfile}>Save</Button>
                        <Button variant="outline" onClick={() => { setEditModalOpen(false); setEditingProfile(null); }}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </RequireAuth>
  );
};

export default AdminPage;
