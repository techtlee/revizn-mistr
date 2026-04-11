import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useDraftCount } from "@/hooks/useDrafts";
import ThemeToggle from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Zap,
  LayoutDashboard,
  FileText,
  FilePenLine,
  Users,
  Building2,
  CalendarDays,
  Library,
  LogOut,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  end?: boolean;
  badge?: number;
}

function useMainNav(): NavItem[] {
  const draftCount = useDraftCount();
  return [
    { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/reports", icon: FileText, label: "Zprávy" },
    { to: "/drafts", icon: FilePenLine, label: "Koncepty", badge: draftCount },
    { to: "/clients", icon: Users, label: "Klienti" },
    { to: "/objects", icon: Building2, label: "Objekty" },
    { to: "/calendar", icon: CalendarDays, label: "Kalendář" },
  ];
}

const BOTTOM_NAV: NavItem[] = [
  { to: "/library", icon: Library, label: "Knihovna" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
}

function SidebarLink({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          collapsed && "justify-center px-2",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )
      }
      title={collapsed ? item.label : undefined}
    >
      <item.icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
      {!collapsed && item.badge != null && item.badge > 0 && (
        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold min-w-[20px] h-5 px-1.5">
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

export default function AppSidebar({ collapsed, onToggleCollapse, onNavigate }: AppSidebarProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const mainNav = useMainNav();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className={cn("flex items-center gap-2 px-4 py-5 border-b border-sidebar-border", collapsed && "justify-center px-2")}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm text-sidebar-foreground tracking-wide uppercase">Revizní mistr</span>
            <span className="text-[10px] text-sidebar-foreground/50 tracking-widest">Správa revizí LPS</span>
          </div>
        )}
      </div>

      {/* New report button */}
      <div className={cn("px-3 pt-4 pb-2", collapsed && "px-2")}>
        <Button
          onClick={() => { navigate("/report/new"); onNavigate?.(); }}
          size="sm"
          className={cn("w-full", collapsed && "px-0")}
          title={collapsed ? "Nová revize" : undefined}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="ml-2">Nová revize</span>}
        </Button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {mainNav.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}

        <div className="my-3 border-t border-sidebar-border" />

        {BOTTOM_NAV.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      {/* Footer actions */}
      <div className={cn("border-t border-sidebar-border px-3 py-3 space-y-1", collapsed && "px-2")}>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          <ThemeToggle />
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              onClick={onToggleCollapse}
              title="Sbalit menu"
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          )}
          {collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              onClick={onToggleCollapse}
              title="Rozbalit menu"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </Button>
          )}
        </div>
        <button
          onClick={() => signOut()}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full",
            "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            collapsed && "justify-center px-2",
          )}
          title={collapsed ? "Odhlásit" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Odhlásit</span>}
        </button>
      </div>
    </div>
  );
}
