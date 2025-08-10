import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { saveInvoice, listInvoices, InvoiceItem, Invoice } from "@/store/demoData";


const Invoices = () => {
  const [customer, setCustomer] = useState("");
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now()+7*86400000).toISOString().slice(0,10));
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "Service", quantity: 1, unitPrice: 100 }]);
  const [refresh, setRefresh] = useState(0);

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
    newWin.document.write(`<html><head><title>Invoice ${id}</title></head><body>
      <h1>Invoice</h1>
      <p><strong>Customer:</strong> ${inv.customer}</p>
      <p><strong>Issue:</strong> ${inv.issueDate} &nbsp; <strong>Due:</strong> ${inv.dueDate}</p>
      <table border="1" cellspacing="0" cellpadding="6">
        <tr><th>Description</th><th>Qty</th><th>Unit</th><th>Total</th></tr>
        ${inv.items.map(it => `<tr><td>${it.description}</td><td>${it.quantity}</td><td>$${it.unitPrice.toFixed(2)}</td><td>$${(it.quantity*it.unitPrice).toFixed(2)}</td></tr>`).join('')}
      </table>
      <h2>Total: $${inv.total.toFixed(2)}</h2>
      </body></html>`);
    newWin.document.close();
    newWin.focus();
    newWin.print();
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
