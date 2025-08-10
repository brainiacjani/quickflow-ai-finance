export type InvoiceItem = { description: string; quantity: number; unitPrice: number };
export type Invoice = {
  id: string;
  customer: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  status: 'draft' | 'sent' | 'paid';
  total: number;
};

export type Expense = {
  id: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  note?: string;
  receiptUrl?: string;
};

const INVOICES_KEY = 'qf_invoices';
const EXPENSES_KEY = 'qf_expenses';

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const listInvoices = (): Invoice[] => read(INVOICES_KEY, [] as Invoice[]);
export const saveInvoice = (inv: Invoice) => {
  const list = listInvoices();
  const idx = list.findIndex((i) => i.id === inv.id);
  if (idx >= 0) list[idx] = inv; else list.push(inv);
  write(INVOICES_KEY, list);
};

export const listExpenses = (): Expense[] => read(EXPENSES_KEY, [] as Expense[]);
export const saveExpense = (exp: Expense) => {
  const list = listExpenses();
  const idx = list.findIndex((e) => e.id === exp.id);
  if (idx >= 0) list[idx] = exp; else list.push(exp);
  write(EXPENSES_KEY, list);
};

export const sums = () => {
  const inv = listInvoices();
  const exp = listExpenses();
  const earned = inv.filter(i => i.status !== 'draft').reduce((s, i) => s + i.total, 0);
  const spent = exp.reduce((s, e) => s + e.amount, 0);
  return { earned, spent };
};
