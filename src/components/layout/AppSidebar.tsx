import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  BarChart3, 
  CreditCard,
  Settings,
  UserPlus,
  Package,
  Truck
} from "lucide-react";
import { Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/integrations/supabase/client';
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
import { useState, useEffect } from 'react';

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Invoices", url: "/invoices", icon: FileText },
  { title: "Expenses", url: "/expenses", icon: Receipt },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Customers", url: "/customers", icon: UserPlus },
  { title: "Vendors", url: "/vendors", icon: Truck },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Admin", url: "/admin", icon: Users },
  { title: "Pricing", url: "/pricing", icon: CreditCard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const profileAny = profile as any;
  const role = profileAny?.role ?? (user?.user_metadata?.role as string | undefined);
  const isAdmin = (profileAny?.is_admin === true) || role === 'admin';
  const visibleNavItems = navItems.filter(i => i.url !== '/admin' || isAdmin);
  
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";
  
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

  const isActive = (path: string) => currentPath === path;

  const [vendorNotifications, setVendorNotifications] = useState<number>(0);
  const [customerNotifications, setCustomerNotifications] = useState<number>(0);
  const [notifications, setNotifications] = useState<Array<any>>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // listen for vendor/customer notifications from other parts of the app
  useEffect(() => {
    const handlerVendors = () => setVendorNotifications((n) => n + 1);
    const handlerCustomers = () => setCustomerNotifications((n) => n + 1);
    const handlerAppNotify = (e: any) => {
      try {
        const d = e?.detail;
        if (!d || !d.type) return;
        if (d.type === 'vendor') setVendorNotifications((n) => n + 1);
        if (d.type === 'customer') setCustomerNotifications((n) => n + 1);
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('vendors:updated', handlerVendors as EventListener);
    window.addEventListener('customers:updated', handlerCustomers as EventListener);
    window.addEventListener('app:notify', handlerAppNotify as EventListener);

    // Also refresh notifications when a notification update event is emitted
    const handlerNotificationsUpdated = () => fetchNotifications();
    window.addEventListener('notifications:updated', handlerNotificationsUpdated as EventListener);

    return () => {
      window.removeEventListener('vendors:updated', handlerVendors as EventListener);
      window.removeEventListener('customers:updated', handlerCustomers as EventListener);
      window.removeEventListener('app:notify', handlerAppNotify as EventListener);
      window.removeEventListener('notifications:updated', handlerNotificationsUpdated as EventListener);
    };
  }, []);

  // fetch notifications from DB for the current user
  const fetchNotifications = async () => {
    try {
      if (!user?.id) { setNotifications([]); setUnreadCount(0); return; }
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const list = data ?? [];
      setNotifications(list as any);
      setUnreadCount((list as any).filter((n:any) => !n.is_read).length || 0);
    } catch (err) {
      // silently ignore if table doesn't exist or permission denied
      console.debug('fetchNotifications failed', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // refetch on login changes
  }, [user?.id]);

  return (
    <Sidebar collapsible="icon" className="border-r bg-white">
      <SidebarHeader className="border-b pb-2">
        <div className="flex items-center gap-2 px-4 py-2">
          <div
            className="h-8 w-8 rounded-lg flex-shrink-0"
            style={{
              background:
                "radial-gradient(120% 120% at 0% 0%, hsl(var(--brand)) 0%, hsl(var(--brand-glow)) 60%, hsl(var(--brand)) 100%)",
              boxShadow: "var(--shadow-glow)" as any,
            }}
          />
          {!isCollapsed && (
            <span className="font-extrabold text-lg">QuickFlow</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span className="flex items-center gap-2">
                        {item.title}
                        {item.title === 'Vendors' && vendorNotifications > 0 && (
                          <span className="inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-semibold px-2 py-0.5">{vendorNotifications}</span>
                        )}
                        {item.title === 'Customers' && customerNotifications > 0 && (
                          <span className="inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-semibold px-2 py-0.5">{customerNotifications}</span>
                        )}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/settings")} tooltip="Settings">
                    <NavLink to="/settings">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {user && (
        <SidebarFooter className="border-t bg-white">
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <SidebarMenuButton
                 size="lg"
                 className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
               >
                <Avatar className="h-8 w-8 rounded-full">
                   <AvatarImage src={profile?.avatar_url ?? undefined} alt={displayName} />
                  <AvatarFallback className="rounded-full">{initials || "U"}</AvatarFallback>
                 </Avatar>
                 <div className="grid flex-1 text-left text-sm leading-tight">
                   <span className="truncate font-semibold">{displayName}</span>
                   <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                 </div>
               </SidebarMenuButton>
             </DropdownMenuTrigger>
             <DropdownMenuContent
               className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
               side="bottom"
               align="end"
               sideOffset={4}
             >
               <DropdownMenuLabel className="p-0 font-normal">
                 <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-full">
                     <AvatarImage src={profile?.avatar_url ?? undefined} alt={displayName} />
                    <AvatarFallback className="rounded-full">{initials || "U"}</AvatarFallback>
                   </Avatar>
                   <div className="grid flex-1 text-left text-sm leading-tight">
                     <span className="truncate font-semibold">{displayName}</span>
                     <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                   </div>
                 </div>
               </DropdownMenuLabel>
               <DropdownMenuSeparator />
               <DropdownMenuItem onClick={() => signOut()} className="text-red-600">
                 Log out
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
         </SidebarFooter>
       )}
     </Sidebar>
   );
 }