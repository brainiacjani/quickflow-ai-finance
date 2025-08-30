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

  // For authenticated users, show sidebar layout
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-purple-200 via-purple-100 to-pink-200 overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
            <SidebarTrigger className="ml-4" />
          </header>
          <main className="flex-1 p-4 sm:p-6">
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
        </div>
      </div>
    </SidebarProvider>
  );
};
