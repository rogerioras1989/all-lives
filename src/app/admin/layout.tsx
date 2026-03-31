"use client";
import { SidebarShell } from "@/components/SidebarShell";

const NAV = [
  { href: "/admin",            label: "Visão Geral",  icon: "📊" },
  { href: "/admin/empresas",   label: "Empresas",     icon: "🏢" },
  { href: "/admin/consultores",label: "Consultores",  icon: "👤" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarShell
      badge="All Lives · Admin"
      title="Administração"
      subtitle="Gerencie empresas, campanhas e consultores."
      nav={NAV}
      userRole="Administrador"
    >
      {children}
    </SidebarShell>
  );
}
