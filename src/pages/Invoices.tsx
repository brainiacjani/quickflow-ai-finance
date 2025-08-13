import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { saveInvoice, listInvoices, InvoiceItem, Invoice } from "@/store/demoData";
import { useCompany } from "@/hooks/useCompany";

const Invoices = () => {
  const [customer, setCustomer] = useState("");
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now()+7*86400000).toISOString().slice(0,10));
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "Service", quantity: 1, unitPrice: 100 }]);
  const [refresh, setRefresh] = useState(0);
  const { data: company } = useCompany();

  const total = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);

  const addItem = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  const updateItem = (idx: number, patch: Partial<InvoiceItem>) => {
    const next = items.slice();
    next[idx] = { ...next[idx], ...patch };
    setItems(next);
  };

  const createInvoice = () => {
    const inv: Invoice = {
      id: crypto.randomUUID(),
      customer, issueDate, dueDate, items, status: 'draft', total
    };
    saveInvoice(inv);
    setCustomer("");
    setItems([{ description: "Service", quantity: 1, unitPrice: 100 }]);
    setRefresh(x => x+1);
  };

  const sendInvoice = (id: string) => {
    const invs = listInvoices();
    const found = invs.find(i => i.id === id);
    if (!found) return;
    found.status = 'sent';
    saveInvoice(found);
    setRefresh(x => x+1);
    alert('Invoice sent (simulated). Use Print to save as PDF.');
  };

  const printInvoice = (id: string) => {
    const inv = listInvoices().find(i => i.id === id);
    if (!inv) return;
    const newWin = window.open('', '_blank');
    if (!newWin) return;

    const rows = inv.items
      .map(it => `<tr>
          <td>${it.description}</td>
          <td class="text-center">${it.quantity}</td>
          <td class="text-right">$${it.unitPrice.toFixed(2)}</td>
          <td class="text-right">$${(it.quantity * it.unitPrice).toFixed(2)}</td>
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
      :root { 
        --primary: 270 95% 75%;
        --primary-glow: 280 100% 85%;
        --brand: 270 95% 75%;
        --brand-glow: 280 100% 85%;
        --brand-contrast: 0 0% 100%;
        --accent: 270 95% 75%;
        --accent-light: 280 100% 95%;
        --fg: 240 10% 3.9%;
        --fg-muted: 240 3.8% 46.1%;
        --bg: 0 0% 100%;
        --surface: 240 4.8% 95.9%;
        --surface-elevated: 0 0% 100%;
        --border: 240 5.9% 90%;
        --border-input: 240 5.9% 90%;
        --destructive: 0 84.2% 60.2%;
        --warning: 38 92% 50%;
        --success: 142 76% 36%;
        --shadow-brand: 0 10px 30px -10px hsl(var(--brand) / 0.3);
        --shadow-glow: 0 0 40px hsl(var(--brand-glow) / 0.4);
        --gradient-brand: linear-gradient(135deg, hsl(var(--brand)), hsl(var(--brand-glow)));
        --gradient-accent: linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-light)));
      }
      * { box-sizing: border-box; }
      body { 
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; 
        margin: 0; 
        padding: 32px; 
        color: hsl(var(--fg)); 
        background: linear-gradient(135deg, hsl(var(--surface)) 0%, hsl(var(--bg)) 100%); 
        min-height: 100vh; 
      }
      .card { 
        max-width: 900px; 
        margin: 0 auto; 
        background: hsl(var(--surface-elevated)); 
        border-radius: 16px; 
        overflow: hidden; 
        box-shadow: var(--shadow-brand), 0 1px 3px 0 hsl(240 5.9% 10% / 0.1); 
      }
      .header { 
        display: flex; 
        align-items: center; 
        justify-content: space-between; 
        padding: 32px; 
        background: var(--gradient-brand); 
        color: hsl(var(--brand-contrast)); 
        position: relative; 
        overflow: hidden; 
      }
      .header::before { 
        content: ''; 
        position: absolute; 
        top: 0; 
        right: 0; 
        width: 200px; 
        height: 200px; 
        background: radial-gradient(circle, hsl(var(--brand-glow) / 0.3) 0%, transparent 70%); 
        border-radius: 50%; 
        transform: translate(50%, -50%); 
      }
      .brand { 
        display: flex; 
        align-items: center; 
        gap: 16px; 
        position: relative; 
        z-index: 1; 
      }
      .brand-name { 
        font-size: 24px; 
        font-weight: 700; 
        letter-spacing: -0.5px; 
      }
      .title { 
        font-size: 36px; 
        font-weight: 800; 
        letter-spacing: -1px; 
        position: relative; 
        z-index: 1; 
      }
      .meta { 
        padding: 24px 32px; 
        background: var(--gradient-accent); 
        color: hsl(var(--fg)); 
        font-size: 15px; 
        display: grid; 
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
        gap: 24px; 
        border-bottom: 1px solid hsl(var(--border)); 
      }
      .meta-item { 
        display: flex; 
        flex-direction: column; 
        gap: 4px; 
      }
      .meta-label { 
        font-weight: 600; 
        color: hsl(var(--fg-muted)); 
        text-transform: uppercase; 
        font-size: 12px; 
        letter-spacing: 0.5px; 
      }
      .meta-value { 
        font-weight: 600; 
        font-size: 16px; 
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 0; 
      }
      th { 
        background: hsl(var(--surface)); 
        color: hsl(var(--fg)); 
        text-align: left; 
        font-weight: 700; 
        font-size: 14px; 
        text-transform: uppercase; 
        letter-spacing: 0.5px; 
        padding: 20px 32px; 
        border-bottom: 2px solid hsl(var(--border)); 
      }
      td { 
        padding: 20px 32px; 
        border-bottom: 1px solid hsl(var(--border)); 
        font-size: 15px; 
      }
      tbody tr:hover { 
        background: hsl(var(--surface) / 0.5); 
      }
      .text-right { 
        text-align: right; 
        font-weight: 600; 
      }
      .text-center { 
        text-align: center; 
        font-weight: 500; 
      }
      .footer { 
        padding: 32px; 
        background: var(--gradient-accent); 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
      }
      .footer-info { 
        color: hsl(var(--fg-muted)); 
        font-size: 14px; 
      }
      .total { 
        font-size: 28px; 
        font-weight: 800; 
        color: hsl(var(--brand)); 
        text-shadow: var(--shadow-glow); 
      }
      .invoice-number { 
        background: hsl(var(--surface)); 
        padding: 8px 16px; 
        border-radius: 8px; 
        font-family: monospace; 
        font-size: 14px; 
        color: hsl(var(--fg-muted)); 
        margin-top: 8px; 
      }
      @media print { 
        body { 
          padding: 0; 
          background: white; 
        } 
        .card { 
          box-shadow: none; 
          border-radius: 0; 
        } 
        tbody tr:hover { 
          background: transparent; 
        } 
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <div class="brand">
          ${logo}
          <div class="brand-name">${companyName}</div>
        </div>
        <div class="title">Invoice</div>
      </div>
      <div class="meta">
        <div class="meta-item">
          <div class="meta-label">Invoice Number</div>
          <div class="meta-value">#${inv.id.slice(0, 8).toUpperCase()}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Issue Date</div>
          <div class="meta-value">${inv.issueDate}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Due Date</div>
          <div class="meta-value">${inv.dueDate}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Bill To</div>
          <div class="meta-value">${inv.customer}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-center">Qty</th>
            <th class="text-right">Unit</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div class="footer">
        <div class="footer-info">
          <div>Thank you for your business!</div>
          <div style="margin-top: 8px; font-size: 12px;">Payment terms: Net 30 days</div>
        </div>
        <div class="total">Total: $${inv.total.toFixed(2)}</div>
      </div>
    </div>
    <script>window.onload = () => { window.print(); }</script>
  </body>
</html>`);
    newWin.document.close();
    newWin.focus();
  };

  const invoices = listInvoices();

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
            <Button variant="hero" onClick={createInvoice}>Save invoice</Button>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-semibold">Your invoices</h2>
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">Issue</th>
                  <th className="text-left p-3">Due</th>
                  <th className="text-left p-3">Total</th>
                  <th className="text-left p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t">
                    <td className="p-3">{inv.customer}</td>
                    <td className="p-3">{inv.issueDate}</td>
                    <td className="p-3">{inv.dueDate}</td>
                    <td className="p-3">${inv.total.toFixed(2)}</td>
                    <td className="p-3 capitalize">{inv.status}</td>
                    <td className="p-3 flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => printInvoice(inv.id)}>Print</Button>
                      {inv.status !== 'paid' && (
                        <Button size="sm" onClick={() => sendInvoice(inv.id)}>Send</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Invoices;
