import { PropsWithChildren, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { MainNav } from "./MainNav";

export const AppShell = ({ children }: PropsWithChildren) => {
  const { user } = useAuth();
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const e = localStorage.getItem('qf_unconfirmed_email');
      setUnconfirmedEmail(e);
    } catch (err) {
      setUnconfirmedEmail(null);
    }
  }, []);

  // For non-authenticated users, show simple layout without sidebar
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-200 via-purple-100 to-pink-200 overflow-x-hidden">
        <MainNav />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t py-8 text-center text-sm text-foreground/60">
          © {new Date().getFullYear()} QuickFlow. All rights reserved.
        </footer>
      </div>
    );
  }

  // For authenticated users, show sidebar layout (desktop) but provide a mobile-app experience on small screens
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-purple-200 via-purple-100 to-pink-200 overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm px-3 sm:px-0">
            <SidebarTrigger className="ml-4" />
            {/* App title center-aligned on mobile, left on desktop */}
            <div className="flex-1 text-center md:text-left font-semibold">QuickFlow</div>
          </header>

          {/* Add extra bottom padding on small screens so content isn't hidden behind the fixed bottom nav */}
          <main className="flex-1 p-4 sm:p-6 pb-24 sm:pb-6">
            {unconfirmedEmail && (
              <div className="mb-4">
                <div className="rounded-md border-l-4 border-yellow-400 bg-yellow-50 px-4 py-3 text-sm">
                  <div className="font-medium">Please confirm your email</div>
                  <div className="text-sm text-muted-foreground">We sent a confirmation link to <strong>{unconfirmedEmail}</strong>. Check your inbox and click the link to confirm your address.</div>
                </div>
              </div>
            )}
            {children}
          </main>

          {/* Mobile bottom nav - appears only on small screens and gives the app a native mobile feel */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-4xl mx-auto flex justify-between items-center px-4 py-2" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <Link to="/" className="flex flex-col items-center text-xs text-foreground/70 hover:text-foreground">
                <svg className="w-6 h-6 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 12L12 3l9 9" />
                  <path d="M9 21V9h6v12" />
                </svg>
                <span className="text-[11px]">Home</span>
              </Link>

              <Link to="/expenses" className="flex flex-col items-center text-xs text-foreground/70 hover:text-foreground">
                <svg className="w-6 h-6 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 10v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" />
                  <path d="M7 14l5-5 5 5" />
                </svg>
                <span className="text-[11px]">Expenses</span>
              </Link>

              <Link to="/invoices" className="flex flex-col items-center text-xs text-foreground/70 hover:text-foreground">
                <svg className="w-6 h-6 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 3v4" />
                </svg>
                <span className="text-[11px]">Invoices</span>
              </Link>

              <Link to="/reports" className="flex flex-col items-center text-xs text-foreground/70 hover:text-foreground">
                <svg className="w-6 h-6 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 3v18h18" />
                  <path d="M18 9l-6 6-3-3" />
                </svg>
                <span className="text-[11px]">Reports</span>
              </Link>

              <Link to="/settings" className="flex flex-col items-center text-xs text-foreground/70 hover:text-foreground">
                <svg className="w-6 h-6 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.73 17.9l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.7 0 1.28-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 6.1 2.73l.06.06c.45.45 1.1.66 1.72.51.5-.12 1-.37 1.5-.67.6-.4 1.3-.4 1.9 0 .5.3 1 .55 1.5.67.62.15 1.27-.06 1.72-.51l.06-.06A2 2 0 1 1 20.3 6.1l-.06.06c-.45.45-.66 1.1-.51 1.72.12.5.37 1 .67 1.5.4.6.4 1.3 0 1.9-.3.5-.55 1-.67 1.5-.15.62.06 1.27.51 1.72l.06.06z" />
                </svg>
                <span className="text-[11px]">Settings</span>
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </SidebarProvider>
  );
};
