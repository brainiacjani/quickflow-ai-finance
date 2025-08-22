import { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";

export const AppShell = ({ children }: PropsWithChildren) => {
  const { user } = useAuth();

  // For non-authenticated users, show simple layout without sidebar
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-200 via-purple-100 to-pink-200">
        <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
          <div className="container flex h-16 items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2 font-extrabold">
              <div
                className="h-7 w-7 rounded-lg"
                style={{
                  background:
                    "radial-gradient(120% 120% at 0% 0%, hsl(var(--brand)) 0%, hsl(var(--brand-glow)) 60%, hsl(var(--brand)) 100%)",
                  boxShadow: "var(--shadow-glow)" as any,
                }}
              />
              <span>QuickFlow</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/auth/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button variant="hero" size="sm">
                  Start free trial
                </Button>
              </Link>
            </div>
          </div>
        </header>
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
      <div className="min-h-screen flex w-full bg-gradient-to-br from-purple-200 via-purple-100 to-pink-200">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
            <SidebarTrigger className="ml-4" />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
