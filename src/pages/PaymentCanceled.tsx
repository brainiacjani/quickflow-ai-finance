import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";

const PaymentCanceled = () => (
  <AppShell>
    <Helmet><title>Payment canceled | QuickFlow</title></Helmet>
    <div className="container py-16 text-center">
      <h1 className="text-2xl font-semibold mb-2">Payment canceled</h1>
      <p className="text-muted-foreground">The payment was canceled or failed. You can try again from your invoice.</p>
    </div>
  </AppShell>
);

export default PaymentCanceled;
