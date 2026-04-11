import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import AppSidebar from "./AppSidebar";
import Footer from "./Footer";

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 64;
const STORAGE_KEY = "sidebar-collapsed";

export default function AppLayout() {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch { /* noop */ }
  }, [collapsed]);

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-4 h-14 shadow-sm">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-wide uppercase">Revizní mistr</span>
          </div>
        </header>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-[280px] bg-sidebar">
            <SheetTitle className="sr-only">Navigace</SheetTitle>
            <AppSidebar collapsed={false} onToggleCollapse={() => {}} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <main className="flex-1 px-4 py-6 pb-20 max-w-6xl mx-auto w-full">
          <Outlet />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside
        className="fixed top-0 left-0 bottom-0 z-40 border-r border-sidebar-border transition-[width] duration-200 ease-in-out"
        style={{ width: sidebarWidth }}
      >
        <AppSidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      </aside>

      {/* Main area */}
      <div
        className="flex flex-col flex-1 min-h-screen transition-[margin] duration-200 ease-in-out"
        style={{ marginLeft: sidebarWidth }}
      >
        <main className="flex-1 px-6 md:px-8 lg:px-10 py-8 pb-20 max-w-6xl mx-auto w-full">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
