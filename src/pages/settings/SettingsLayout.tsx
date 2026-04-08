import { useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import SettingsSubNav from "./SettingsSubNav";

export default function SettingsLayout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="page-content max-w-4xl mx-auto py-8 px-4">
        <div className="flex flex-wrap items-center gap-4 mb-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Hlavní přehled
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Knihovna šablon a údajů</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Společná knihovna pro všechny uživatele (u vytvořených záznamů je uveden autor). Výchozí hodnoty revize jsou
          jen u vás.
        </p>
        <SettingsSubNav />
        <Outlet />
      </div>
    </div>
  );
}
