import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
  Headset,
  ChevronDown,
  List,
  Clock,
  BarChart3,
} from "lucide-react";

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  end?: boolean;
  badge?: number;
}

interface NavGroupItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: NavItem[];
}

type SidebarEntry = NavItem | NavGroupItem;

function isGroup(entry: SidebarEntry): entry is NavGroupItem {
  return "children" in entry;
}

function useMainNav(): SidebarEntry[] {
  const draftCount = useDraftCount();
  return [
    { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
    {
      icon: FileText,
      label: "Zprávy",
      children: [
        { to: "/reports", icon: List, label: "Seznam", end: true },
        { to: "/reports/deadlines", icon: Clock, label: "Termíny" },
        { to: "/reports/stats", icon: BarChart3, label: "Statistiky" },
      ],
    },
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

function SidebarLink({ item, collapsed, onNavigate, indent }: { item: NavItem; collapsed: boolean; onNavigate?: () => void; indent?: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          collapsed && "justify-center px-2",
          indent && !collapsed && "pl-10",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )
      }
      title={collapsed ? item.label : undefined}
    >
      <item.icon className={cn("shrink-0", indent ? "w-4 h-4" : "w-5 h-5")} />
      {!collapsed && <span>{item.label}</span>}
      {!collapsed && item.badge != null && item.badge > 0 && (
        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold min-w-[20px] h-5 px-1.5">
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

function SidebarGroup({ group, collapsed, onNavigate }: { group: NavGroupItem; collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const isChildActive = group.children.some((child) =>
    child.end ? location.pathname === child.to : location.pathname.startsWith(child.to),
  );
  const [open, setOpen] = useState(isChildActive);

  if (collapsed) {
    return (
      <>
        {group.children.map((child) => (
          <SidebarLink key={child.to} item={{ ...child, icon: child === group.children[0] ? group.icon : child.icon }} collapsed onNavigate={onNavigate} />
        ))}
      </>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isChildActive
            ? "text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )}
      >
        <group.icon className="w-5 h-5 shrink-0" />
        <span>{group.label}</span>
        <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {group.children.map((child) => (
            <SidebarLink key={child.to} item={child} collapsed={false} onNavigate={onNavigate} indent />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppSidebar({ collapsed, onToggleCollapse, onNavigate }: AppSidebarProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const mainNav = useMainNav();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("flex items-center gap-2 px-4 py-5 border-b border-sidebar-border", collapsed && "justify-center px-2")}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-sm text-sidebar-foreground tracking-wide uppercase">Revizní mistr</span>
              <span className="text-[10px] text-sidebar-foreground/50 tracking-widest">Správa revizí LPS</span>
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </>
        )}
      </div>

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

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {mainNav.map((entry, i) =>
          isGroup(entry) ? (
            <SidebarGroup key={i} group={entry} collapsed={collapsed} onNavigate={onNavigate} />
          ) : (
            <SidebarLink key={entry.to} item={entry} collapsed={collapsed} onNavigate={onNavigate} />
          ),
        )}

        <div className="my-3 border-t border-sidebar-border" />

        {BOTTOM_NAV.map((item) => (
          <SidebarLink key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className={cn("border-t border-sidebar-border px-3 py-3 space-y-1", collapsed && "px-2")}>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-end")}>
          {collapsed && <ThemeToggle />}
          {!collapsed && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" onClick={onToggleCollapse} title="Sbalit menu">
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          )}
          {collapsed && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" onClick={onToggleCollapse} title="Rozbalit menu">
              <PanelLeftOpen className="w-4 h-4" />
            </Button>
          )}
        </div>
        <NavLink
          to="/support"
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full",
              collapsed && "justify-center px-2",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )
          }
          title={collapsed ? "Podpora" : undefined}
        >
          <Headset className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Podpora</span>}
        </NavLink>
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
