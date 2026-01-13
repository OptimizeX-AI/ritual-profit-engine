import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FolderKanban, DollarSign, Target, Settings, ChevronLeft, BookOpen, Clock, BarChart3, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import logoPvm from "@/assets/logo-pvm.jpeg";
interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}
const navItems: NavItem[] = [{
  title: "Dashboard",
  href: "/",
  icon: LayoutDashboard
}, {
  title: "CRM",
  href: "/crm",
  icon: Target,
  badge: "3"
}, {
  title: "Clientes",
  href: "/clientes",
  icon: Building2
}, {
  title: "Projetos",
  href: "/projetos",
  icon: FolderKanban
}, {
  title: "Bíblia",
  href: "/tarefas",
  icon: BookOpen
}, {
  title: "Timesheet",
  href: "/timesheet",
  icon: Clock
}, {
  title: "Financeiro",
  href: "/financeiro",
  icon: DollarSign
}, {
  title: "Relatórios",
  href: "/relatorios",
  icon: BarChart3
}, {
  title: "Equipe",
  href: "/equipe",
  icon: Users
}, {
  title: "Configurações",
  href: "/configuracoes",
  icon: Settings
}];
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  return <aside className={cn("fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar transition-all duration-300", collapsed ? "w-16" : "w-64")}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && <div className="flex items-center gap-3">
            <img src={logoPvm} alt="PVM Digital" className="h-8 w-8 rounded-md object-cover" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">FVM Digital</span>
              <span className="text-xs text-sidebar-foreground/60">Gestão Agência</span>
            </div>
          </div>}
        <button onClick={() => setCollapsed(!collapsed)} className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map(item => {
          const isActive = location.pathname === item.href;
          return <li key={item.href}>
                <Link to={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all", isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground")}>
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                          {item.badge}
                        </span>}
                    </>}
                </Link>
              </li>;
        })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-4">
        {!collapsed ? <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
              LC
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">Lázaro Carmo</span>
              <span className="text-xs text-sidebar-foreground/60">Administrador</span>
            </div>
          </div> : <div className="flex justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
              LC
            </div>
          </div>}
      </div>
    </aside>;
}