import { NavLink, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/invoices", label: "Invoices" },
  { to: "/expenses", label: "Expenses" },
  { to: "/reports", label: "Reports" },
  { to: "/pricing", label: "Pricing" },
];

export const MainNav = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <a href="/" className="inline-flex items-center gap-2 font-semibold">
          <div className="h-7 w-7 rounded-md" style={{
            background: "radial-gradient(120% 120% at 0% 0%, hsl(var(--brand)) 0%, hsl(var(--brand-glow)) 60%, hsl(var(--brand)) 100%)",
            boxShadow: "var(--shadow-glow)" as any,
          }} />
          <span>QuickFlow</span>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 text-sm rounded-md transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/70 hover:text-foreground hover:bg-accent"
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/auth/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/onboarding">
            <Button variant="hero" size="sm">Start free trial</Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
