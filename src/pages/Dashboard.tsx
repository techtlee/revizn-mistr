import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatObjektAdresaOneLine } from "@/lib/objectAddress";
import { useDraftCount } from "@/hooks/useDrafts";
import { useClientsQuery } from "@/hooks/useClients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Users,
  Building2,
  Calendar,
  FilePenLine,
  Clock,
  Shield,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Plus,
} from "lucide-react";
import { addYears, differenceInDays, format } from "date-fns";
import { cs } from "date-fns/locale";

function getRevisionInterval(tridaLps: string | null, type: "official" | "visual"): number {
  if (type === "visual") return 1;
  if (tridaLps === "I" || tridaLps === "II") return 2;
  return 4;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const draftCount = useDraftCount();
  const { data: clients } = useClientsQuery();

  const { data: reports } = useQuery({
    queryKey: ["reports-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspection_reports")
        .select("id, ev_cislo_zpravy, objednatel_revize, adresa_ulice, adresa_obec, adresa_psc, adresa_doplnek, datum_zahajeni, celkovy_posudek, trida_lps, typ_revize, created_at, updated_at, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const completedReports = reports?.filter((r) => r.status === "complete" || !r.status) ?? [];
  const recentReports = completedReports.slice(0, 5);

  const uniqueObjects = useMemo(() => {
    const keys = new Set<string>();
    for (const r of completedReports) {
      const k = [r.adresa_ulice, r.adresa_obec, r.adresa_psc].map((s) => (s || "").trim().toLowerCase()).join("|");
      if (k.replace(/\|/g, "")) keys.add(k);
    }
    return keys.size;
  }, [completedReports]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const withDate = completedReports.filter((r) => r.datum_zahajeni);

    const latestByBuilding = new Map<string, (typeof withDate)[number]>();
    for (const r of withDate) {
      const key = (formatObjektAdresaOneLine(r) || r.id).trim().toLowerCase();
      const existing = latestByBuilding.get(key);
      if (!existing || r.datum_zahajeni! > existing.datum_zahajeni!) {
        latestByBuilding.set(key, r);
      }
    }

    return Array.from(latestByBuilding.values())
      .map((r) => {
        const interval = getRevisionInterval(r.trida_lps, "official");
        const nextDate = addYears(new Date(r.datum_zahajeni!), interval);
        const daysRemaining = differenceInDays(nextDate, now);
        return {
          id: r.id,
          address: formatObjektAdresaOneLine(r),
          evCislo: r.ev_cislo_zpravy,
          tridaLps: r.trida_lps,
          nextDate,
          daysRemaining,
        };
      })
      .filter((d) => d.daysRemaining <= 180)
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 7);
  }, [completedReports]);

  const overdueCount = upcomingDeadlines.filter((d) => d.daysRemaining < 0).length;

  const stats = [
    {
      label: "Celkem zpráv",
      value: completedReports.length,
      icon: FileText,
      color: "text-primary",
      onClick: () => navigate("/reports"),
    },
    {
      label: "Koncepty",
      value: draftCount,
      icon: FilePenLine,
      color: "text-amber-500",
      onClick: () => navigate("/drafts"),
    },
    {
      label: "Klienti",
      value: clients?.length ?? 0,
      icon: Users,
      color: "text-emerald-600",
      onClick: () => navigate("/clients"),
    },
    {
      label: "Objekty",
      value: uniqueObjects,
      icon: Building2,
      color: "text-blue-500",
      onClick: () => navigate("/objects"),
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Revizní mistr – přehled revizí dle ČSN EN 62305</p>
        </div>
        <Button onClick={() => navigate("/report/new")} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nová revize
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={stat.onClick}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-20`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming deadlines */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-5 h-5" />
                Blížící se termíny
                {overdueCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {overdueCount} po termínu
                  </Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/calendar")} className="text-xs">
                Zobrazit vše <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingDeadlines.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Žádné blížící se termíny v příštích 6 měsících</p>
              </div>
            ) : (
              <div className="divide-y">
                {upcomingDeadlines.map((d) => {
                  const overdue = d.daysRemaining < 0;
                  const urgent = d.daysRemaining >= 0 && d.daysRemaining <= 90;
                  return (
                    <div
                      key={d.id}
                      className={`flex items-center gap-3 px-6 py-3 hover:bg-muted/50 cursor-pointer ${overdue ? "bg-red-50/50 dark:bg-red-950/20" : ""}`}
                      onClick={() => navigate(`/report/${d.id}/edit`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.address || "Neznámá adresa"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {d.tridaLps && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Shield className="w-3 h-3" /> {d.tridaLps}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(d.nextDate, "d. M. yyyy", { locale: cs })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {overdue ? (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {d.daysRemaining} dní
                          </Badge>
                        ) : urgent ? (
                          <Badge className="bg-amber-500 text-white border-0 text-xs">
                            {d.daysRemaining} dní
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground tabular-nums">{d.daysRemaining} dní</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent reports */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-5 h-5" />
                Poslední zprávy
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/reports")} className="text-xs">
                Zobrazit vše <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentReports.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Zatím žádné revizní zprávy</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentReports.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/report/${r.id}/edit`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-primary">
                          {r.ev_cislo_zpravy || "—"}
                        </span>
                        {r.celkovy_posudek === "v souladu" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : r.celkovy_posudek === "není v souladu" ? (
                          <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {formatObjektAdresaOneLine(r) || r.objednatel_revize || "—"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {r.datum_zahajeni
                          ? format(new Date(r.datum_zahajeni), "d. M. yyyy", { locale: cs })
                          : format(new Date(r.created_at), "d. M. yyyy", { locale: cs })}
                      </p>
                      {r.typ_revize && (
                        <p className="text-xs text-muted-foreground/70 capitalize mt-0.5">{r.typ_revize}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
