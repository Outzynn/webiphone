import {
  LayoutDashboard,
  Smartphone,
  ShoppingCart,
  CalendarClock,
  CalendarCheck,
  Users,
  Truck,
  ShieldCheck,
  Tag,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventario", label: "Inventario", icon: Smartphone },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/reservas", label: "Reservas", icon: CalendarCheck },
  { href: "/cuotas", label: "Cuotas", icon: CalendarClock },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/proveedores", label: "Proveedores", icon: Truck },
  { href: "/garantias", label: "Garantías", icon: ShieldCheck },
  { href: "/etiquetas", label: "Etiquetas", icon: Tag },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];
