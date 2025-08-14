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
      body { 
        font-family: 'Arial', sans-serif; 
        background: #f8f9fa; 
        padding: 20px; 
        color: #333; 
        line-height: 1.6;
      }
      .invoice-container { 
        max-width: 800px; 
        margin: 0 auto; 
        background: white; 
        border-radius: 8px; 
        overflow: hidden; 
        box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
      }
      .invoice-header { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        padding: 30px; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        color: white; 
      }
      .company-info { 
        display: flex; 
        align-items: center; 
        gap: 15px; 
      }
      .company-logo { 
        width: 50px; 
        height: 50px; 
        background: rgba(255,255,255,0.2); 
        border-radius: 8px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-weight: bold; 
        font-size: 18px; 
      }
      .company-name { 
        font-size: 24px; 
        font-weight: bold; 
      }
      .invoice-title { 
        font-size: 32px; 
        font-weight: bold; 
        text-transform: uppercase; 
        letter-spacing: 2px; 
      }
      .invoice-meta { 
        display: grid; 
        grid-template-columns: repeat(2, 1fr); 
        gap: 30px; 
        padding: 30px; 
        background: #f8f9fb; 
        border-bottom: 3px solid #e9ecef; 
      }
      .supplier-info, .invoice-info { 
        background: white; 
        padding: 20px; 
        border-radius: 8px; 
        box-shadow: 0 2px 10px rgba(0,0,0,0.08); 
      }
      .section-title { 
        font-size: 14px; 
        font-weight: bold; 
        text-transform: uppercase; 
        color: #6c757d; 
        margin-bottom: 15px; 
        letter-spacing: 1px; 
        border-bottom: 2px solid #dee2e6; 
        padding-bottom: 8px; 
      }
      .info-row { 
        display: flex; 
        justify-content: space-between; 
        margin-bottom: 8px; 
      }
      .info-label { 
        color: #6c757d; 
        font-weight: 500; 
      }
      .info-value { 
        font-weight: bold; 
        color: #212529; 
      }
      .product-section { 
        padding: 30px; 
      }
      .product-title { 
        font-size: 16px; 
        font-weight: bold; 
        margin-bottom: 20px; 
        color: #495057; 
        text-transform: uppercase; 
        letter-spacing: 1px; 
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-bottom: 30px; 
        background: white; 
        border-radius: 8px; 
        overflow: hidden; 
        box-shadow: 0 2px 10px rgba(0,0,0,0.08); 
      }
      th { 
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); 
        color: #495057; 
        text-align: left; 
        font-weight: bold; 
        font-size: 12px; 
        text-transform: uppercase; 
        letter-spacing: 1px; 
        padding: 15px; 
        border-bottom: 2px solid #dee2e6; 
      }
      td { 
        padding: 15px; 
        border-bottom: 1px solid #f1f3f4; 
        font-size: 14px; 
      }
      tbody tr:hover { 
        background: #f8f9fa; 
      }
      .text-right { 
        text-align: right; 
        font-weight: 600; 
      }
      .text-center { 
        text-align: center; 
      }
      .font-bold { 
        font-weight: bold; 
        color: #212529; 
      }
      .payment-summary { 
        background: linear-gradient(135deg, #f8f9fb 0%, #ffffff 100%); 
        padding: 30px; 
        border-top: 3px solid #e9ecef; 
      }
      .payment-grid { 
        display: grid; 
        grid-template-columns: 1fr auto; 
        gap: 30px; 
        align-items: end; 
      }
      .payment-info { 
        color: #6c757d; 
        font-size: 14px; 
      }
      .total-amount { 
        text-align: right; 
      }
      .total-label { 
        font-size: 16px; 
        color: #6c757d; 
        margin-bottom: 5px; 
      }
      .total-value { 
        font-size: 28px; 
        font-weight: bold; 
        color: #007bff; 
        font-family: 'Georgia', serif; 
      }
      .footer-info { 
        margin-top: 20px; 
        padding-top: 20px; 
        border-top: 1px solid #e9ecef; 
        text-align: center; 
        color: #6c757d; 
        font-size: 12px; 
      }
      @media print { 
        body { 
          background: white; 
          padding: 0; 
        } 
        .invoice-container { 
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
    <div class="invoice-container">
      <div class="invoice-header">
        <div class="company-info">
          ${logo || '<div class="company-logo">C</div>'}
          <div class="company-name">${companyName}</div>
        </div>
        <div class="invoice-title">Invoice</div>
      </div>
      
      <div class="invoice-meta">
        <div class="supplier-info">
          <div class="section-title">Supplier Information</div>
          <div class="info-row">
            <span class="info-label">Company:</span>
            <span class="info-value">${companyName}</span>
          </div>
        </div>
        
        <div class="invoice-info">
          <div class="section-title">Invoice Details</div>
          <div class="info-row">
            <span class="info-label">Invoice #:</span>
            <span class="info-value">#${inv.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span class="info-value">${inv.issueDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Due Date:</span>
            <span class="info-value">${inv.dueDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Bill To:</span>
            <span class="info-value">${inv.customer}</span>
          </div>
        </div>
      </div>
      
      <div class="product-section">
        <div class="product-title">Product Information</div>
        <table>
          <thead>
            <tr>
              <th style="width: 40%;">Description</th>
              <th class="text-center" style="width: 15%;">Ordered Qty</th>
              <th class="text-center" style="width: 15%;">Received Qty</th>
              <th class="text-right" style="width: 15%;">Rate</th>
              <th class="text-right" style="width: 15%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
      
      <div class="payment-summary">
        <div class="payment-grid">
          <div class="payment-info">
            <div><strong>Payment Information</strong></div>
            <div style="margin-top: 10px;">
              <div>Amount Paid: $0.00</div>
              <div>Amount Due: $${inv.total.toFixed(2)}</div>
            </div>
            <div class="footer-info">
              <div><strong>Order Summary</strong></div>
              <div>Order Date: ${inv.issueDate}</div>
              <div>Received Date: N/A</div>
            </div>
          </div>
          
          <div class="total-amount">
            <div class="total-label">Total Amount:</div>
            <div class="total-value">$${inv.total.toFixed(2)}</div>
          </div>
        </div>
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
