import { PropsWithChildren, useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificationsTop } from "@/components/notifications/NotificationsTop";
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

// ProfileMenu component: moved to top-level to avoid declaring functions inside JSX
function ProfileMenu() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const displayName = (profile as any)?.display_name || (profile as any)?.first_name || user?.email || 'Account';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-accent transition">
          <Avatar className="h-8 w-8">
            <AvatarImage src={(profile as any)?.avatar_url ?? undefined} alt="Profile picture" />
            <AvatarFallback>{(displayName || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link to="/settings"><DropdownMenuItem>Settings</DropdownMenuItem></Link>
        <DropdownMenuItem onClick={() => signOut()} className="text-destructive">Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const AppShell = ({ children }: PropsWithChildren) => {
  const { user } = useAuth();
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // landing header state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');
  const headerRef = useRef<HTMLElement | null>(null);
  const [isNavigating, setIsNavigating] = useState(false); // used to hide header on auth navigation

  // authenticated route transition
  const [routeChanging, setRouteChanging] = useState(false);

  useEffect(() => {
    try { const e = localStorage.getItem('qf_unconfirmed_email'); setUnconfirmedEmail(e); } catch (e) { setUnconfirmedEmail(null); }
  }, []);

  // enable smooth native scrolling
  useEffect(() => {
    try { document.documentElement.style.scrollBehavior = 'smooth'; } catch (e) {}
  }, []);

  // active section watcher for landing
  useEffect(() => {
    const ids = ['home', 'services', 'about', 'contact'];
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActiveSection(entry.target.id);
      });
    }, { root: null, rootMargin: '-40% 0px -40% 0px', threshold: 0.1 });

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });

    return () => obs.disconnect();
  }, []);

  // route transition effect: when pathname changes, play a brief transition in authenticated area
  useEffect(() => {
    setRouteChanging(true);
    const t = window.setTimeout(() => setRouteChanging(false), 300);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  const handleNavClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMobileNavOpen(false);
    const el = document.getElementById(id);
    const headerHeight = headerRef.current?.offsetHeight ?? 64;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const top = window.pageYOffset + rect.top - headerHeight - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  // If user is not authenticated: render public landing header
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-200 via-purple-100 to-pink-200 overflow-x-hidden">
        <header ref={headerRef as any} className={`w-full fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform transition-opacity duration-200 ease-out ${isNavigating ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
          <div className="max-w-4xl mx-auto grid grid-cols-3 items-center p-4">
            {/* left: brand (links to landing page) */}
            <div className="flex items-center">
              <a href="/" onClick={(e) => { e.preventDefault(); setMobileNavOpen(false); setIsNavigating(true); setTimeout(() => navigate('/'), 260); }} className="inline-flex items-center gap-2 font-semibold">
                <div className="h-7 w-7 rounded-md" style={{ background: "radial-gradient(120% 120% at 0% 0%, hsl(var(--brand)) 0%, hsl(var(--brand-glow)) 60%, hsl(var(--brand)) 100%)", boxShadow: "var(--shadow-glow)" as any }} />
                <span>QuickFlow</span>
              </a>
            </div>

            {/* center: nav (centered) */}
            <nav className="flex justify-center">
              <div className="hidden sm:flex items-center gap-6">
                <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className={`text-sm ${activeSection === 'home' ? 'text-brand font-semibold' : 'text-foreground/80 hover:text-foreground'}`}>Home</a>
                <a href="#services" onClick={(e) => handleNavClick(e, 'services')} className={`text-sm ${activeSection === 'services' ? 'text-brand font-semibold' : 'text-foreground/80 hover:text-foreground'}`}>Services</a>
                <a href="#about" onClick={(e) => handleNavClick(e, 'about')} className={`text-sm ${activeSection === 'about' ? 'text-brand font-semibold' : 'text-foreground/80 hover:text-foreground'}`}>About</a>
                <a href="#contact" onClick={(e) => handleNavClick(e, 'contact')} className={`text-sm ${activeSection === 'contact' ? 'text-brand font-semibold' : 'text-foreground/80 hover:text-foreground'}`}>Contact</a>
              </div>
              {/* mobile hamburger */}
              <div className="sm:hidden">
                <button aria-expanded={mobileNavOpen} aria-label="Toggle navigation" onClick={() => setMobileNavOpen(v => !v)} className="p-2 rounded-md hover:bg-accent/10">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={mobileNavOpen ? 'M6 18L18 6M6 6l12 12' : 'M3 12h18M3 6h18M3 18h18'} />
                  </svg>
                </button>
              </div>
            </nav>

            {/* right: auth buttons - hidden on very small screens (mobile menu will surface them) */}
            <div className="flex justify-end space-x-2">
              <div className="hidden sm:flex items-center gap-2">
                <a href="/auth/login" onClick={(e) => { e.preventDefault(); setIsNavigating(true); setTimeout(() => navigate('/auth/login'), 260); }}><Button variant="ghost" size="sm">Log in</Button></a>
                <a href="/auth/signup" onClick={(e) => { e.preventDefault(); setIsNavigating(true); setTimeout(() => navigate('/auth/signup'), 260); }}><Button variant="hero" size="sm">Start free trial</Button></a>
              </div>
            </div>
          </div>

          {/* mobile dropdown menu */}
          {mobileNavOpen && (
            <div className="sm:hidden border-t bg-background/95">
              <div className="max-w-4xl mx-auto flex flex-col p-4 gap-3">
                <a href="#home" onClick={(e)=>handleNavClick(e,'home')} className={`text-sm ${activeSection === 'home' ? 'text-brand font-semibold' : 'text-foreground/80'}`}>Home</a>
                <a href="#services" onClick={(e)=>handleNavClick(e,'services')} className={`text-sm ${activeSection === 'services' ? 'text-brand font-semibold' : 'text-foreground/80'}`}>Services</a>
                <a href="#about" onClick={(e)=>handleNavClick(e,'about')} className={`text-sm ${activeSection === 'about' ? 'text-brand font-semibold' : 'text-foreground/80'}`}>About</a>
                <a href="#contact" onClick={(e)=>handleNavClick(e,'contact')} className={`text-sm ${activeSection === 'contact' ? 'text-brand font-semibold' : 'text-foreground/80'}`}>Contact</a>
                <div className="pt-2 border-t mt-2">
                  <a href="/auth/login" onClick={(e) => { e.preventDefault(); setIsNavigating(true); setTimeout(() => navigate('/auth/login'), 260); }}><Button variant="ghost" size="sm" className="w-full">Log in</Button></a>
                  <a href="/auth/signup" onClick={(e) => { e.preventDefault(); setIsNavigating(true); setTimeout(() => navigate('/auth/signup'), 260); }}><Button variant="hero" size="sm" className="w-full mt-2">Start free trial</Button></a>
                </div>
              </div>
            </div>
          )}
        </header>

        <main className={`flex-1 pt-16 ${isNavigating ? 'opacity-75' : 'opacity-100'}`}>
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

        <footer className="border-t py-8 text-center text-sm text-foreground/60">
          © {new Date().getFullYear()} QuickFlow. All rights reserved.
        </footer>
      </div>
    );
  }

  // Authenticated layout
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-purple-200 via-purple-100 to-pink-200 overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm px-3 sm:px-0">
            <SidebarTrigger className="ml-4" />
            <div className="flex-1 text-center md:text-left font-semibold">QuickFlow</div>
            <div className="hidden md:flex items-center pr-4 gap-3">
              <NotificationsTop />
              <ProfileMenu />
            </div>
          </header>

          <main className={`flex-1 p-4 sm:p-6 pb-24 sm:pb-6 transition-transform transition-opacity duration-300 ease-in-out ${routeChanging ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}`}>
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
