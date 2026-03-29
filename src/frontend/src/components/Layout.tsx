import { useQueryClient } from "@tanstack/react-query";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  ScanLine,
  Settings,
  Truck,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/scan", icon: ScanLine, label: "Skanna" },
  { to: "/besiktning", icon: ClipboardCheck, label: "Besiktning" },
  { to: "/admin", icon: Settings, label: "Admin" },
];

export default function Layout() {
  const { clear } = useInternetIdentity();
  const qc = useQueryClient();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { data: profile } = useGetCallerUserProfile();

  const isPrintPage = currentPath.includes("/print");
  if (isPrintPage) return <Outlet />;

  const handleLogout = async () => {
    await clear();
    qc.clear();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header
        className="no-print sticky top-0 z-50"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.13 0.015 240), oklch(0.18 0.012 240))",
        }}
      >
        <div className="flex items-center justify-between px-4 h-14 max-w-5xl mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Truck className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              Ställningstracker
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {profile && (
              <span className="text-white/70 text-sm hidden sm:block">
                {profile.name}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="text-white/70 hover:text-white transition-colors"
              title="Logga ut"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-8">
        <Outlet />
      </main>

      <nav
        className="no-print fixed bottom-0 left-0 right-0 bg-white border-t border-border md:hidden z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                data-ocid={`nav.${item.label.toLowerCase()}.link`}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <nav className="no-print hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-card border border-border px-2 py-1 gap-1 z-50">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              data-ocid={`nav.${item.label.toLowerCase()}.link`}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
