import { Helmet } from "react-helmet-async";
import { AppShell } from "@/components/layout/AppShell";

const PaymentSuccess = () => (
  <AppShell>
    <Helmet><title>Payment success | QuickFlow</title></Helmet>
    <div className="container py-16 text-center">
      <h1 className="text-2xl font-semibold mb-2">Payment successful 🎉</h1>
      <p className="text-muted-foreground">Thank you! Your invoice has been paid.</p>
    </div>
  </AppShell>
);

export default PaymentSuccess;
