import {
  Building2,
  CalendarClock,
  LayoutDashboard,
  type LucideIcon,
  Users,
} from "lucide-react";
import type { Role } from "~/utils/constant.schema";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  // If set, the item is only shown to these roles; otherwise it's shown to everyone.
  roles?: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Patients", href: "/patients", icon: Users },
  { label: "Visits", href: "/visits", icon: CalendarClock },
  { label: "Clinic", href: "/clinic", icon: Building2, roles: ["doctor"] },
];

// Nav items visible for the given role (null = role not yet known → role-scoped
// items are hidden until it resolves).
export function visibleNavItems(role: Role | null): NavItem[] {
  return NAV_ITEMS.filter(
    (item) => !item.roles || (role != null && item.roles.includes(role)),
  );
}

// Active when the pathname equals the href or is a nested route under it.
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
