import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Plus, Search, FileText, Calendar, User, Building2, Pencil, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/lib/pdfExport";

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspection_reports")
        .select("id, cislo_revize, objednavatel, adresa_objektu, nazev_objektu, datum_provedeni, celkovy_posudek, revizni_technik, druh_revize, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = reports?.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.cislo_revize?.toLowerCase().includes(q) ||
      r.objednavatel?.toLowerCase().includes(q) ||
      r.adresa_objektu?.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu chcete smazat tuto revizní zprávu?")) return;
    const { error } = await supabase.from("inspection_reports").delete().eq("id", id);
    if (error) {
      toast({ title: "Chyba", description: "Nepodařilo se smazat zprávu.", variant: "destructive" });
    } else {
      toast({ title: "Smazáno", description: "Revizní zpráva byla smazána." });
      refetch();
    }
  };

  const handleExport = async (id: string) => {
    try {
      const { data: report } = await supabase
        .from("inspection_reports")
        .select("*")
        .eq("id", id)
        .single();

      const { data: standards } = await supabase
        .from("report_standards")
        .select("*")
        .eq("report_id", id)
        .order("sort_order");

      const { data: instruments } = await supabase
        .from("report_instruments")
        .select("*")
        .eq("report_id", id)
        .order("sort_order");

      const { data: measurements } = await supabase
        .from("report_measurements")
        .select("*")
        .eq("report_id", id)
        .order("sort_order");

      if (report) {
        generatePDF(report, standards || [], instruments || [], measurements || []);
      }
    } catch {
      toast({ title: "Chyba", description: "Nepodařilo se exportovat zprávu.", variant: "destructive" });
    }
  };

  const posudekColor = (posudek: string | null) => {
    if (posudek === "Soustava hromosvodu je schopná bezpečného provozu") return "bg-green-100 text-green-800 border-green-200";
    if (posudek === "Soustava vyžaduje opravu") return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (posudek === "Soustava není bezpečná") return "bg-red-100 text-red-800 border-red-200";
    return "bg-muted text-muted-foreground border-border";
  };

  const posudekShort = (posudek: string | null) => {
    if (posudek === "Soustava hromosvodu je schopná bezpečného provozu") return "Schopná provozu";
    if (posudek === "Soustava vyžaduje opravu") return "Vyžaduje opravu";
    if (posudek === "Soustava není bezpečná") return "Není bezpečná";
    return "Bez posudku";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="nav-bar">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">LPS Revize</span>
        </div>
        <div className="ml-auto">
          <Button onClick={() => navigate("/report/new")} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nová revize
          </Button>
        </div>
      </nav>

      <div className="page-content">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">Revizní zprávy LPS</h1>
          <p className="text-muted-foreground">Správa revizí soustav hromosvodu</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-lg border p-4">
            <div className="text-2xl font-bold text-primary">{reports?.length ?? 0}</div>
            <div className="text-sm text-muted-foreground">Celkem zpráv</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-2xl font-bold" style={{ color: "hsl(142 71% 35%)" }}>
              {reports?.filter(r => r.celkovy_posudek === "Soustava hromosvodu je schopná bezpečného provozu").length ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">Schopné provozu</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-2xl font-bold" style={{ color: "hsl(38 92% 45%)" }}>
              {reports?.filter(r => r.celkovy_posudek === "Soustava vyžaduje opravu").length ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">Vyžaduje opravu</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-2xl font-bold text-destructive">
              {reports?.filter(r => r.celkovy_posudek === "Soustava není bezpečná").length ?? 0}
            </div>
            <div className="text-sm text-muted-foreground">Není bezpečná</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Hledat dle čísla revize, objednavatele nebo adresy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="section-card">
          <div className="section-header flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Seznam revizních zpráv
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Načítání...</div>
            ) : !filtered?.length ? (
              <div className="p-12 text-center">
                <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground font-medium">
                  {searchQuery ? "Žádné výsledky nenalezeny" : "Zatím žádné revizní zprávy"}
                </p>
                {!searchQuery && (
                  <Button className="mt-4" onClick={() => navigate("/report/new")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Vytvořit první zprávu
                  </Button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Číslo revize</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Objednavatel</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-foreground hidden md:table-cell">Adresa objektu</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-foreground hidden lg:table-cell">Datum</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-foreground hidden lg:table-cell">Druh</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Posudek</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-foreground">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-primary text-sm">
                          {report.cislo_revize || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm">{report.objednavatel || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{report.adresa_objektu || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {report.datum_provedeni
                            ? format(new Date(report.datum_provedeni), "d. M. yyyy", { locale: cs })
                            : "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm capitalize">{report.druh_revize || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${posudekColor(report.celkovy_posudek)}`}>
                          {posudekShort(report.celkovy_posudek)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleExport(report.id)}
                            title="Exportovat PDF"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(`/report/${report.id}/edit`)}
                            title="Upravit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(report.id)}
                            title="Smazat"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
