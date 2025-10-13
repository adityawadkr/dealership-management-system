"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Car, 
  Wrench, 
  Package, 
  DollarSign, 
  Users, 
  FileText, 
  Settings,
  LayoutDashboard,
  Calendar,
  Truck,
  ClipboardCheck,
  UserCog,
  TrendingUp,
  ShoppingCart,
  Bell
} from "lucide-react";
import { useRoles } from "@/hooks/use-roles";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard.view",
  },
  {
    title: "Sales",
    href: "/sales",
    icon: TrendingUp,
    permission: "sales.view",
    children: [
      { title: "Leads", href: "/sales/leads", icon: Users, permission: "leads.view" },
      { title: "Test Drives", href: "/sales/test-drives", icon: Car, permission: "test-drives.view" },
      { title: "Quotations", href: "/sales/quotations", icon: FileText, permission: "quotations.view" },
      { title: "Bookings", href: "/sales/bookings", icon: ShoppingCart, permission: "bookings.view" },
      { title: "Delivery", href: "/sales/delivery", icon: Truck, permission: "sales.view" },
    ],
  },
  {
    title: "Service",
    href: "/service",
    icon: Wrench,
    permission: "service.view",
    children: [
      { title: "Appointments", href: "/service/appointments", icon: Calendar, permission: "appointments.view" },
      { title: "Job Cards", href: "/service/job-cards", icon: ClipboardCheck, permission: "job-cards.view" },
      { title: "Service History", href: "/service/history", icon: FileText, permission: "service-history.view" },
    ],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
    permission: "inventory.view",
    children: [
      { title: "Vehicles", href: "/inventory/vehicles", icon: Car, permission: "vehicles.view" },
      { title: "Spare Parts", href: "/inventory/spare-parts", icon: Package, permission: "spare-parts.view" },
    ],
  },
  {
    title: "Finance",
    href: "/finance",
    icon: DollarSign,
    permission: "finance.view",
  },
  {
    title: "CRM",
    href: "/crm",
    icon: Users,
    permission: "crm.view",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: FileText,
    permission: "reports.view",
  },
  {
    title: "HR & Admin",
    href: "/admin",
    icon: UserCog,
    permission: "hr.view",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { hasPermission, loading } = useRoles();

  if (loading) {
    return (
      <div className="w-64 border-r bg-card p-4 space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-muted animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  const renderNavItem = (item: NavItem) => {
    if (!hasPermission(item.permission)) {
      return null;
    }

    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;

    if (item.children) {
      return (
        <div key={item.href} className="space-y-1">
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.title}
          </Link>
          <div className="ml-6 space-y-1">
            {item.children.map((child) => renderNavItem(child))}
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className="size-4" />
        {item.title}
      </Link>
    );
  };

  return (
    <aside className="w-64 border-r bg-card">
      <div className="flex h-full flex-col">
        <div className="border-b p-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Car className="size-6 text-primary" />
            <span>Dealership DMS</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4 overflow-auto">
          {navItems.map((item) => renderNavItem(item))}
        </nav>
      </div>
    </aside>
  );
}