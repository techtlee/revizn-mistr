import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatObjektAdresaOneLine } from "@/lib/objectAddress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Search,
  FileText,
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
  Shield,
  Eye,
} from "lucide-react";
import { addYears, differenceInDays, format } from "date-fns";
import { cs } from "date-fns/locale";

function getRevisionInterval(tridaLps: string | null): number {
  if (tridaLps === "I" || tridaLps === "II") return 2;
  return 4;
}

interface ObjectRow {
  addressKey: string;
  displayAddress: string;
  city: string;
  reportCount: number;
  lastInspectionDate: string | null;
  nextDueDate: Date | null;
  daysRemaining: number | null;
  lastPosudek: string | null;
  lastTridaLps: string | null;
  latestReportId: string;
}

export default function Objects() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["reports-for-objects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspection_reports")
        .select("id, adresa_ulice, adresa_obec, adresa_psc, adresa_doplnek, datum_zahajeni, celkovy_posudek, trida_lps, created_at")
        .or("status.eq.complete,status.is.null")
        .order("datum_zahajeni", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const objects: ObjectRow[] = useMemo(() => {
    if (!reports) return [];
    const map = new Map<string, typeof reports>();

    for (const r of reports) {
      const key = [r.adresa_ulice, r.adresa_obec, r.adresa_psc]
        .map((s) => (s || "").trim().toLowerCase())
        .join("|");
      if (!key.replace(/\|/g, "")) continue;
      const existing = map.get(key) ?? [];
      existing.push(r);
      map.set(key, existing);
    }

    const now = new Date();
    return Array.from(map.entries()).map(([key, reps]) => {
      const latest = reps[0];
      const lastDate = latest.datum_zahajeni;
      const interval = getRevisionInterval(latest.trida_lps);
      const nextDue = lastDate ? addYears(new Date(lastDate), interval) : null;
      const daysRem = nextDue ? differenceInDays(nextDue, now) : null;

      return {
        addressKey: key,
        displayAddress: formatObjektAdresaOneLine(latest),
        city: latest.adresa_obec || "",
        reportCount: reps.length,
        lastInspectionDate: lastDate,
        nextDueDate: nextDue,
        daysRemaining: daysRem,
        lastPosudek: latest.celkovy_posudek,
        lastTridaLps: latest.trida_lps,
        latestReportId: latest.id,
      };
    }).sort((a, b) => {
      if (a.daysRemaining == null && b.daysRemaining == null) return 0;
      if (a.daysRemaining == null) return 1;
      if (b.daysRemaining == null) return -1;
      return a.daysRemaining - b.daysRemaining;
    });
  }, [reports]);

  const filtered = objects.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return o.displayAddress.toLowerCase().includes(q) || o.city.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Objekty</h1>
          <p className="text-muted-foreground mt-1">Přehled revidovaných objektů a budov</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Hledat dle adresy nebo města..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5" />
            Objekty
            {filtered.length > 0 && <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !filtered.length ? (
            <div className="p-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">
                {searchQuery ? "Žádné objekty neodpovídají hledání" : "Zatím žádné objekty"}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Objekty se zobrazí automaticky z adres v revizních zprávách.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adresa objektu</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">Revizí</TableHead>
                  <TableHead className="hidden md:table-cell">Třída LPS</TableHead>
                  <TableHead className="hidden lg:table-cell">Poslední revize</TableHead>
                  <TableHead>Příští revize</TableHead>
                  <TableHead className="hidden sm:table-cell">Stav</TableHead>
                  <TableHead className="text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((obj) => {
                  const overdue = obj.daysRemaining != null && obj.daysRemaining < 0;
                  const urgent = obj.daysRemaining != null && obj.daysRemaining >= 0 && obj.daysRemaining <= 90;

                  return (
                    <TableRow
                      key={obj.addressKey}
                      className={overdue ? "bg-red-50/50 dark:bg-red-950/20" : ""}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">{obj.displayAddress || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="font-semibold">{obj.reportCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {obj.lastTridaLps ? (
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-semibold">{obj.lastTridaLps}</span>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {obj.lastInspectionDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            {format(new Date(obj.lastInspectionDate), "dd.MM.yyyy", { locale: cs })}
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {obj.nextDueDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span className={overdue ? "text-red-600 font-semibold" : urgent ? "text-amber-600 font-semibold" : ""}>
                              {format(obj.nextDueDate, "dd.MM.yyyy", { locale: cs })}
                            </span>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {obj.lastPosudek === "v souladu" ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600/90 text-white border-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> OK
                          </Badge>
                        ) : obj.lastPosudek === "není v souladu" ? (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" /> Závady
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">—</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/report/${obj.latestReportId}`)}
                          title="Zobrazit"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
