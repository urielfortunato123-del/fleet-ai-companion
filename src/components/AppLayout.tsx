import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Car, Wrench, Fuel, CircleDot, FileText, AlertTriangle,
  Users, Settings, Bot, CalendarClock, Menu, X, LogOut, ChevronLeft, TrendingDown, Gauge
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/daily-ops", label: "Operação do Dia", icon: CalendarClock },
  { path: "/vehicles", label: "Veículos", icon: Car },
  { path: "/maintenance", label: "Manutenção", icon: Wrench },
  { path: "/fuel", label: "Combustível", icon: Fuel },
  { path: "/tires", label: "Pneus", icon: CircleDot },
  { path: "/fines", label: "Multas & Docs", icon: FileText },
  { path: "/incidents", label: "Ocorrências", icon: AlertTriangle },
  { path: "/drivers", label: "Motoristas", icon: Users },
  { path: "/optimization", label: "Estudo Otimização", icon: TrendingDown },
  { path: "/utilization", label: "Utilização Frota", icon: Gauge },
  { path: "/import", label: "Importar Dados", icon: FileText },
  { path: "/assistant", label: "Assistente IA", icon: Bot },
  { path: "/admin", label: "Admin", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 lg:relative
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "w-[68px]" : "w-64"}`}
      >
        {/* Logo */}
        <div className={`flex h-16 items-center border-b border-sidebar-border px-4 ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
            FS
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">FrotaSênior</span>
              <span className="text-[10px] text-sidebar-muted">AI Fleet Management</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-md p-1 text-sidebar-muted hover:text-sidebar-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                  ${isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }
                  ${collapsed ? "justify-center px-2" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {isActive && item.path === "/daily-ops" && !collapsed && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-critical text-[10px] text-critical-foreground font-bold">
                    3
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden lg:flex border-t border-sidebar-border p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">850 veículos</span>
            <ThemeToggle />
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {user?.email?.substring(0, 2).toUpperCase() ?? "U"}
            </div>
            <button
              onClick={async () => { await signOut(); navigate("/login"); }}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
