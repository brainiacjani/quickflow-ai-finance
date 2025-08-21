import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const roleOptions = ["user", "viewer", "admin"];
const availableReports = ["sales", "expenses", "invoices", "cashflow"];

const AdminPage = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [reportForm, setReportForm] = useState({ name: '', description: '', query: '', access: [] as string[] });

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

  if (!user) return null;

  return (
    <RequireAuth>
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
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-4 p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{p.first_name ? `${p.first_name} ${p.last_name ?? ''}`.trim() : p.display_name ?? p.email ?? p.id}</div>
                        <div className="text-sm text-muted-foreground">{p.email ?? ''}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={p.role ?? 'user'}
                          onChange={(e) => updateProfile(p.id, { role: e.target.value })}
                          className="rounded border px-2 py-1"
                        >
                          {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>

                        <div className="flex items-center gap-2">
                          {availableReports.map((r) => (
                            <label key={r} className="flex items-center gap-1 text-sm">
                              <input
                                type="checkbox"
                                checked={reports.includes(r)}
                                onChange={async (ev) => {
                                  const next = ev.target.checked ? Array.from(new Set([...reports, r])) : reports.filter((x: string) => x !== r);
                                  await updateProfile(p.id, { report_access: JSON.stringify(next) });
                                }}
                              />
                              <span className="capitalize">{r}</span>
                            </label>
                          ))}
                        </div>

                        <Button size="sm" onClick={() => updateProfile(p.id, { is_active: !p.is_active })}>
                          {p.is_active ? 'Disable' : 'Enable'}
                        </Button>
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

            <Modal open={reportModalOpen} onOpenChange={setReportModalOpen}>
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
            </Modal>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
};

export default AdminPage;
