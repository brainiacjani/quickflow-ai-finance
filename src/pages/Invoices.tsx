import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceItem, Invoice } from "@/store/demoData"; // keep types for UI
import DataTable from "@/components/dashboard/DataTable";
import { useCompany } from "@/hooks/useCompany";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import useClientPagination from "@/hooks/useClientPagination";
import { Button } from "@/components/ui/button";

const Invoices = () => {
  const { user } = useAuth();
  const [customer, setCustomer] = useState("");
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now()+7*86400000).toISOString().slice(0,10));
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "Service", quantity: 1, unitPrice: 100 }]);
  const [refresh, setRefresh] = useState(0);
  const { data: company } = useCompany();
  const { data: profile } = useProfile();
  const isAdmin = Boolean((profile as any)?.is_admin || user?.user_metadata?.role === 'admin');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const total = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

  // client side pagination
  const { paginatedItems: paginatedInvoices, currentPage: invoicePage, totalPages: invoiceTotalPages, setPage: setInvoicePage } = useClientPagination(invoices, 10);

  const addItem = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  const updateItem = (idx: number, patch: Partial<InvoiceItem>) => {
    const next = items.slice();
    next[idx] = { ...next[idx], ...patch };
    setItems(next);
  };

  const createInvoice = async () => {
    setSaving(true);
    try {
      if (!user?.id) throw new Error('You must be signed in to create invoices');
      const payload = {
        id: crypto.randomUUID(),
        customer,
        issuedate: issueDate,
        duedate: dueDate,
        items: JSON.stringify(items),
        status: 'draft',
        total,
        created_by: user.id
      };
      const { error } = await supabase.from('invoices').insert(payload);
      if (error) throw error;
      setCustomer("");
      setItems([{ description: "Service", quantity: 1, unitPrice: 100 }]);
      setRefresh(x => x+1);
    } catch (e) {
      console.error('createInvoice error', e);
      alert('Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const sendInvoice = async (id: string) => {
    try {
      const { error } = await supabase.from('invoices').update({ status: 'sent' }).eq('id', id);
      if (error) throw error;
      setRefresh(x => x+1);
      alert('Invoice sent (simulated). Use Print to save as PDF.');
    } catch (e) {
      console.error('sendInvoice error', e);
      alert('Failed to send invoice');
    }
  };

  const printInvoice = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    const newWin = window.open('', '_blank');
    if (!newWin) return;

    const rows = inv.items
      .map(it => `<tr>
          <td class="item-desc">${it.description}</td>
          <td class="text-center">${it.quantity}</td>
          <td class="text-center">${it.quantity}</td>
          <td class="text-right">$${it.unitPrice.toFixed(2)}</td>
          <td class="text-right font-bold">$${(it.quantity * it.unitPrice).toFixed(2)}</td>
        </tr>`) 
      .join('');

    const logo = company && (company as any).logo_url
      ? `<img src="${(company as any).logo_url}" alt="${company?.name || 'Company'} logo" style="height:48px;width:auto;object-fit:contain;border-radius:8px;" />`
      : '';

    const companyName = company?.name || 'Your Company';

    newWin.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoice ${id}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { height: 100%; }
      body { 
        font-family: 'Arial', sans-serif; 
        background: #fff; 
        color: #333; 
        line-height: 1.4;
      }

      /* Container uses full printable width and is compact for print */
      .invoice-container { 
        width: 100%; 
        max-width: 800px; 
        margin: 0 auto; 
        background: white; 
        border-radius: 6px; 
        overflow: hidden; 
        padding: 16px; 
      }

      .invoice-header { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        padding-bottom: 8px;
        border-bottom: 1px solid #e9ecef;
      }
      .company-info { display:flex; align-items:center; gap:12px; }
      .company-name { font-size: 18px; font-weight: 700; }
      .invoice-title { font-size: 18px; font-weight: 700; text-transform: uppercase; }

      .invoice-meta { 
        display: flex; 
        gap: 12px; 
        padding: 12px 0; 
      }
      .supplier-info, .invoice-info { flex: 1; font-size: 12px; }
      .section-title { font-size: 11px; font-weight: 700; color: #666; margin-bottom: 6px; }
      .info-row { display:flex; justify-content:space-between; margin-bottom:4px; }
      .info-label{ color:#666; }

      /* New: ensure supplier info values align left instead of being spaced to the right */
      .supplier-info .info-row { justify-content: flex-start; }
      .supplier-info .info-row span { display: inline-block; }
      .supplier-info .info-row span + span { margin-left: 8px; text-align: left; }

      .product-section { padding-top: 8px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 12px; }
      th { text-align: left; font-size: 11px; padding: 8px; color: #444; border-bottom:1px solid #eaeaea; }
      td { padding: 8px; border-bottom: 1px solid #f3f3f3; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .font-bold { font-weight: 700; }

      .payment-summary { padding-top: 8px; display:flex; justify-content:space-between; align-items:flex-end; font-size:12px; }
      .total-value { font-size: 18px; font-weight: 800; color:#0b67ff; }

      .footer-info { margin-top: 8px; font-size: 11px; color:#666; text-align:center; }

      /* Print-focused rules: remove shadows, tighten spacing, and force single-page if possible */
      @page { size: A4 portrait; margin: 10mm; }
      @media print {
        body { background: white; padding: 0; }
        .invoice-container { box-shadow: none; border-radius: 0; padding: 8px; }
        th, td { padding: 6px; }
        .invoice-header, .invoice-meta, .payment-summary { padding: 4px 0; }
        .company-name, .invoice-title, .total-value { font-size: 16px; }
        .footer-info { font-size: 10px; }
        /* Avoid page breaks inside the invoice container */
        .invoice-container { page-break-inside: avoid; }

        /* Ensure supplier rows are left-aligned when printed */
        .supplier-info .info-row { justify-content: flex-start; }
        .supplier-info .info-row span + span { margin-left: 6px; }
      }
    </style>
  </head>
  <body>
    <div class="invoice-container">
      <div class="invoice-header">
        <div class="company-info">
          ${logo || '<div style="width:36px;height:36px;background:#eee;border-radius:6px;display:inline-block"></div>'}
          <div class="company-name">${companyName}</div>
        </div>
        <div class="invoice-title">Invoice</div>
      </div>
      <div class="invoice-meta">
        <div class="supplier-info">
          <div class="section-title">Supplier Information</div>
          <div class="info-row"><span class="info-label">Company:</span><span>${companyName}</span></div>
        </div>
        <div class="invoice-info">
          <div class="section-title">Invoice Details</div>
          <div class="info-row"><span class="info-label">Invoice #:</span><span class="font-bold">#${inv.id.slice(0, 8).toUpperCase()}</span></div>
          <div class="info-row"><span class="info-label">Date:</span><span>${inv.issueDate}</span></div>
          <div class="info-row"><span class="info-label">Due:</span><span>${inv.dueDate}</span></div>
          <div class="info-row"><span class="info-label">Bill To:</span><span>${inv.customer}</span></div>
        </div>
      </div>

      <div class="product-section">
        <table>
          <thead>
            <tr>
              <th style="width:50%">Description</th>
              <th class="text-center" style="width:12%">Qty</th>
              <th class="text-right" style="width:19%">Rate</th>
              <th class="text-right" style="width:19%">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>

      <div class="payment-summary">
        <div>
          <div><strong>Payment Information</strong></div>
          <div style="margin-top:6px;">Amount Due: $${inv.total.toFixed(2)}</div>
        </div>
        <div class="total-value">$${inv.total.toFixed(2)}</div>
      </div>

      <div class="footer-info">Generated by QuickFlow • ${new Date().toLocaleDateString()}</div>
    </div>

    <script>
      // Try to scale the content to fit a single page when necessary
      function scaleToFit() {
        try {
          const container = document.querySelector('.invoice-container');
          if (!container) return;
          // Measure heights
          const contentHeight = container.scrollHeight;
          const pageHeight = window.innerHeight; // viewport height as an approximation
          if (contentHeight > pageHeight) {
            const scale = Math.max(0.45, pageHeight / contentHeight);
            container.style.transform = 'scale(' + scale + ')';
            container.style.transformOrigin = 'top left';
            // Expand body height so print dialog captures the scaled size
            document.body.style.height = Math.ceil(contentHeight * scale) + 'px';
          }
        } catch (e) {
          // ignore
        }
      }

      window.onload = () => {
        // Give layout a moment to settle, then scale and print
        setTimeout(() => {
          scaleToFit();
          setTimeout(() => { window.print(); }, 300);
        }, 120);
      };
    </script>
  </body>
</html>`);
    newWin.document.close();
    newWin.focus();
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        if (!user?.id) {
          setInvoices([]);
          return;
        }
        // If current user is admin, fetch all invoices; otherwise fetch only user's invoices
        let q = supabase.from('invoices').select('*').order('created_at', { ascending: false });
        if (!isAdmin) q = q.eq('created_by', user.id);
        const { data, error } = await q;
        if (error) throw error;
        // Normalize items column (may be stored as JSON string or jsonb) and unify date field names
        const normalized = (data ?? []).map((d: any) => {
          let parsedItems = [];
          try {
            if (typeof d.items === 'string') parsedItems = JSON.parse(d.items || '[]');
            else if (Array.isArray(d.items)) parsedItems = d.items;
            else parsedItems = [];
          } catch (e) {
            parsedItems = [];
          }

          return {
            ...d,
            items: parsedItems,
            // UI expects issueDate/dueDate keys
            issueDate: d.issuedate ?? d.issueDate ?? d.issuedAt ?? d.created_at ?? null,
            dueDate: d.duedate ?? d.dueDate ?? null,
          };
        });

        setInvoices(normalized);
       } catch (e) {
         console.error('fetchInvoices error', e);
       }
     };
     fetchInvoices();
   }, [refresh, user?.id, isAdmin]);

  return (
    <AppShell>
      <Helmet>
        <title>Invoices | QuickFlow</title>
        <meta name="description" content="Create, send, and manage invoices with QuickFlow." />
        <link rel="canonical" href="https://quickflow.app/invoices" />
      </Helmet>

      <div className="container py-8 grid gap-8">
        <section className="grid gap-4">
          <h1 className="text-2xl font-semibold">Create invoice</h1>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm">Customer</label>
              <input className="rounded-md border bg-background px-3 py-2" placeholder="Acme Inc" value={customer} onChange={e=>setCustomer(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm">Issue date</label>
                <input type="date" className="rounded-md border bg-background px-3 py-2" value={issueDate} onChange={e=>setIssueDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm">Due date</label>
                <input type="date" className="rounded-md border bg-background px-3 py-2" value={dueDate} onChange={e=>setDueDate(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Items</label>
            <div className="grid gap-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-6 gap-2">
                  <input className="col-span-3 rounded-md border bg-background px-3 py-2" placeholder="Description" value={it.description} onChange={e=>updateItem(idx,{ description: e.target.value })} />
                  <input type="number" className="col-span-1 rounded-md border bg-background px-3 py-2" value={it.quantity} onChange={e=>updateItem(idx,{ quantity: Number(e.target.value) })} />
                  <input type="number" className="col-span-1 rounded-md border bg-background px-3 py-2" value={it.unitPrice} onChange={e=>updateItem(idx,{ unitPrice: Number(e.target.value) })} />
                  <div className="col-span-1 flex items-center">${(it.quantity*it.unitPrice).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div><Button variant="ghost" size="sm" onClick={addItem}>Add item</Button></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Total: ${total.toFixed(2)}</div>
            <Button variant="hero" onClick={createInvoice} disabled={saving}>{saving ? 'Saving...' : 'Save invoice'}</Button>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-semibold">Your invoices</h2>
          <DataTable
            title="Invoices"
            columns={[
              { key: 'invoiceNumber', label: 'Invoice #', bold: true },
              { key: 'customer', label: 'Customer' },
              { key: 'total', label: 'Amount' },
              { key: 'status', label: 'Status' },
              { key: 'issueDate', label: 'Date' },
            ]}
            data={paginatedInvoices.map(i => ({
              id: i.id,
              invoiceNumber: (i.id || '').toString().slice(0,8).toUpperCase(),
              customer: i.customer,
              total: `$${Number(i.total ?? 0).toFixed(2)}`,
              status: i.status,
              issueDate: i.issueDate ?? i.created_at ?? null,
            }))}
            renderActions={(row) => (
              <>
                <Button size="sm" variant="outline" onClick={() => printInvoice(row.id)}>Print</Button>
                {row.status !== 'paid' && (
                  <Button size="sm" onClick={() => sendInvoice(row.id)}>Send</Button>
                )}
              </>
            )}
          />

          {/* pagination controls */}
          <div className="flex items-center justify-end space-x-3 mt-4">
            <Button size="sm" variant="ghost" onClick={() => setInvoicePage(invoicePage - 1)} disabled={invoicePage === 1}>Prev</Button>

            <div className="flex items-center space-x-2">
              {Array.from({ length: invoiceTotalPages }).map((_, idx) => {
                const p = idx + 1;
                return (
                  <Button key={p} size="sm" variant={p === invoicePage ? 'default' : 'ghost'} onClick={() => setInvoicePage(p)}>{p}</Button>
                );
              })}
            </div>

            <Button size="sm" onClick={() => setInvoicePage(invoicePage + 1)} disabled={invoicePage === invoiceTotalPages}>Next</Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Invoices;
