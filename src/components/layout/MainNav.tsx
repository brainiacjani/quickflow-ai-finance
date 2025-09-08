import { NavLink, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/invoices", label: "Invoices" },
  { to: "/expenses", label: "Expenses" },
  { to: "/reports", label: "Reports" },
  { to: "/pricing", label: "Pricing" },
];

export const MainNav = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Array<any>>([]);

  // Determine if current user is an admin: prefer explicit is_admin flag, then profile.role, then user metadata
  const profileAny = profile as any;
  const role = profileAny?.role ?? (user?.user_metadata?.role as string | undefined);
  const isAdmin = (profileAny?.is_admin === true) || role === 'admin';

  const displayName =
    profile?.display_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    "Account";

  const initials = (displayName || "")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const handlerAppNotify = (e: any) => {
      const detail = e?.detail ?? null;
      if (detail) setNotifications((n) => [detail, ...n]);
    };

    const handlerCustomersUpdated = (e?: any) => {
      // if the event carries detail, prefer it, otherwise use a fallback notification
      const d = e?.detail ?? { type: 'customer', title: 'Customer created', message: 'A customer was created. Click to view.' };
      setNotifications((n) => [d, ...n]);
    };

    const handlerVendorsUpdated = (e?: any) => {
      const d = e?.detail ?? { type: 'vendor', title: 'Vendor created', message: 'A vendor was created. Click to view.' };
      setNotifications((n) => [d, ...n]);
    };

    window.addEventListener('app:notify', handlerAppNotify as EventListener);
    window.addEventListener('customers:updated', handlerCustomersUpdated as EventListener);
    window.addEventListener('vendors:updated', handlerVendorsUpdated as EventListener);

    return () => {
      window.removeEventListener('app:notify', handlerAppNotify as EventListener);
      window.removeEventListener('customers:updated', handlerCustomersUpdated as EventListener);
      window.removeEventListener('vendors:updated', handlerVendorsUpdated as EventListener);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="inline-flex items-center gap-2 font-semibold">
          <div
            className="h-7 w-7 rounded-md"
            style={{
              background:
                "radial-gradient(120% 120% at 0% 0%, hsl(var(--brand)) 0%, hsl(var(--brand-glow)) 60%, hsl(var(--brand)) 100%)",
              boxShadow: "var(--shadow-glow)" as any,
            }}
          />
          <span>QuickFlow</span>
        </a>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 text-sm rounded-full transition-colors",
                  isActive
                    ? "bg-gradient-to-r from-[hsl(var(--primary-1))] to-[hsl(var(--primary-2))] text-white shadow-[var(--shadow-glow)]"
                    : "text-foreground/70 hover:text-foreground hover:bg-accent"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                "px-3 py-2 text-sm rounded-md transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground/70 hover:text-foreground hover:bg-accent"
              )
            }
          >
            Admin
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {/* Mobile menu trigger (shows links in a dropdown) */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-md hover:bg-accent">
                  <Menu className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {links.map((l) => (
                  <Link key={l.to} to={l.to}>
                    <DropdownMenuItem className="cursor-pointer">{l.label}</DropdownMenuItem>
                  </Link>
                ))}
                <Link to="/admin">
                  <DropdownMenuItem className="cursor-pointer">Admin</DropdownMenuItem>
                </Link>
                {!user && (
                  <>
                    <DropdownMenuSeparator />
                    <Link to="/auth/login"><DropdownMenuItem className="cursor-pointer">Log in</DropdownMenuItem></Link>
                    <Link to="/auth/signup"><DropdownMenuItem className="cursor-pointer">Sign up</DropdownMenuItem></Link>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {!user ? (
            <>
              <Link to="/auth/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button variant="hero" size="sm">
                  Start free trial
                </Button>
              </Link>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-accent transition shadow-sm">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url ?? undefined} alt={displayName} />
                      <AvatarFallback>{initials || "U"}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm">{displayName}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link to="/dashboard">
                    <DropdownMenuItem className="cursor-pointer">Dashboard</DropdownMenuItem>
                  </Link>
                  <Link to="/admin">
                    <DropdownMenuItem className="cursor-pointer">Admin</DropdownMenuItem>
                  </Link>
                  <Link to="/settings">
                    <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  {!user && (
                    <Link to="/auth/signup">
                      <DropdownMenuItem className="cursor-pointer">Sign up</DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => signOut()}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          {/* Notifications button */}
          {user && (
            <div className="relative">
              <button className="p-2 rounded-md hover:bg-accent" onClick={(ev) => { /* toggle dropdown via focus or show inline */ }}>
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[11px] font-semibold px-1.5 py-0.5">{notifications.length}</span>
                )}
              </button>
              {/* simple dropdown */}
              {notifications.length > 0 && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg z-50 p-2">
                  <div className="text-xs text-muted-foreground px-2 pb-2">Notifications</div>
                  <div className="max-h-64 overflow-auto">
                    {notifications.map((n, idx) => (
                      <div key={idx} className="p-2 hover:bg-accent/10 cursor-pointer rounded" onClick={() => {
                        // navigate based on type
                        if (n.type === 'vendor') navigate('/vendors');
                        else if (n.type === 'customer') navigate('/customers');
                        setNotifications((prev) => prev.filter((_, i) => i !== idx));
                      }}>
                        <div className="font-medium text-sm">{n.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{n.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
