import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";

import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Reset from "./pages/auth/Reset";
import UpdatePassword from "./pages/auth/UpdatePassword";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import NotFound from "./pages/NotFound";
import { RequireAuth } from "./components/auth/RequireAuth";
import { RedirectIfAuthed } from "./components/auth/RedirectIfAuthed";
import Admin from "./pages/Admin";
import RequireRole from "./components/auth/RequireRole";
import Contact from "./pages/Contact";
import Customers from "./pages/Customers";
import Inventory from "./pages/Inventory";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/pricing" element={<Pricing />} />

                  <Route path="/auth/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
                  <Route path="/auth/signup" element={<RedirectIfAuthed><Signup /></RedirectIfAuthed>} />
                  <Route path="/auth/reset" element={<RedirectIfAuthed><Reset /></RedirectIfAuthed>} />
                  <Route path="/auth/update-password" element={<UpdatePassword />} />

                  <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />

                  <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                  <Route path="/invoices" element={<RequireAuth><Invoices /></RequireAuth>} />
                  <Route path="/expenses" element={<RequireAuth><Expenses /></RequireAuth>} />
                  <Route path="/customers" element={<RequireAuth><Customers /></RequireAuth>} />
                  <Route path="/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
                  <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                  <Route path="/contact" element={<Contact />} />

                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/payment-canceled" element={<PaymentCanceled />} />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
