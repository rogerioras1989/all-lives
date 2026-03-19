"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  disabled?: boolean;
};

type SidebarShellProps = {
  badge: string;
  title: string;
  subtitle?: string;
  nav: NavItem[];
  userName?: string | null;
  userRole?: string | null;
  actions?: ReactNode;
  children: ReactNode;
};

function isActive(pathname: string, href: string) {
  if (href === pathname) return true;
  if (href !== "/" && pathname.startsWith(`${href}/`)) return true;
  return false;
}

export function SidebarShell({
  badge,
  title,
  subtitle,
  nav,
  userName,
  userRole,
  actions,
  children,
}: SidebarShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <aside
      className="w-full lg:w-[280px] shrink-0"
      style={{
        background: "linear-gradient(180deg, rgba(11,25,41,0.96) 0%, rgba(22,49,70,0.96) 100%)",
        color: "white",
      }}
    >
      <div className="sticky top-0 min-h-screen px-5 py-6">
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ background: "rgba(91,170,109,0.14)", color: "#9fe0b0" }}
          >
            {badge}
          </div>
          <h1 className="mt-4 text-xl font-bold">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.62)" }}>
              {subtitle}
            </p>
          )}
        </div>

        <nav className="space-y-2">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.disabled ? "#" : item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all"
                style={{
                  opacity: item.disabled ? 0.45 : 1,
                  pointerEvents: item.disabled ? "none" : "auto",
                  background: active ? "rgba(91,158,201,0.18)" : "transparent",
                  border: active ? "1px solid rgba(91,158,201,0.25)" : "1px solid transparent",
                  color: active ? "#ffffff" : "rgba(255,255,255,0.75)",
                }}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {(userName || userRole) && (
          <div
            className="mt-8 rounded-3xl p-4"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-xs uppercase tracking-[0.14em]" style={{ color: "rgba(255,255,255,0.45)" }}>
              Sessão
            </p>
            <p className="mt-2 text-sm font-semibold">{userName ?? "Usuário"}</p>
            {userRole && (
              <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                {userRole}
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <main className="min-h-screen gradient-hero">
      <div className="lg:hidden sticky top-0 z-30 border-b bg-white/80 px-4 py-3 backdrop-blur-md" style={{ borderColor: "rgba(91,158,201,0.15)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#5b9ec9" }}>
              {badge}
            </p>
            <p className="text-sm font-semibold" style={{ color: "#1e3a4a" }}>
              {title}
            </p>
          </div>
          <button className="btn-ghost px-3 py-2 text-xs" onClick={() => setMobileOpen((open) => !open)}>
            Menu
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)}>
          <div className="h-full w-[88%] max-w-[320px]" onClick={(event) => event.stopPropagation()}>
            {sidebar}
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-[1600px]">
        <div className="hidden lg:block">{sidebar}</div>
        <section className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {actions && <div className="mb-6 flex flex-wrap items-center justify-end gap-2">{actions}</div>}
          {children}
        </section>
      </div>
    </main>
  );
}
