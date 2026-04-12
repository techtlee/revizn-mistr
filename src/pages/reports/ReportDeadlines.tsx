import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatObjektAdresaOneLine } from "@/lib/objectAddress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Calendar, Clock, ChevronLeft, ChevronRight,
  Download, Eye, Pencil, Shield, MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addMonths, addYears, differenceInDays, format, startOfMonth } from "date-fns";
import { cs } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useReportsQuery, type ReportRow } from "@/hooks/useReportsQuery";
import { generatePDF } from "@/lib/pdfExport";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { Tables } from "@/integrations/supabase/types";
type Instrument = Tables<"report_instruments">;
type Measurement = Tables<"report_measurements">;
type SpdDevice = Tables<"report_spd_devices">;

type RevisionType = "official" | "visual";

function getRevisionInterval(tridaLps: string | null, type: RevisionType): number {
  if (type === "visual") return 1;
  if (tridaLps === "I" || tridaLps === "II") return 2;
  return 4;
}

type UrgencyStatus = "overdue" | "urgent" | "upcoming" | "ok";

function getUrgency(daysRemaining: number): UrgencyStatus {
  if (daysRemaining < 0) return "overdue";
  if (daysRemaining <= 90) return "urgent";
  if (daysRemaining <= 180) return "upcoming";
  return "ok";
}

const URGENCY_CONFIG: Record<UrgencyStatus, { label: string; className: string }> = {
  overdue: { label: "Po termínu", className: "bg-red-600 hover:bg-red-600/90 text-white border-0" },
  urgent: { label: "Blíží se termín", className: "bg-amber-500 hover:bg-amber-500/90 text-white border-0" },
  upcoming: { label: "Nadcházející", className: "bg-yellow-400 hover:bg-yellow-400/90 text-black border-0" },
  ok: { label: "V pořádku", className: "bg-emerald-600 hover:bg-emerald-600/90 text-white border-0" },
};

const PAGE_SIZE = 10;

interface DeadlineRow {
  id: string;
  ev_cislo_zpravy: string | null;
  adresa_zobrazeni: string;
  objednatel_revize: string | null;
  trida_lps: string | null;
  datum_zahajeni: string;
  nextRevisionDate: Date;
  daysRemaining: number;
  urgency: UrgencyStatus;
}

function buildDeadlineRows(reports: ReportRow[], type: RevisionType): DeadlineRow[] {
  const withDate = reports.filter((r): r is typeof r & { datum_zahajeni: string } => !!r.datum_zahajeni);

  const latestByBuilding = new Map<string, (typeof withDate)[number]>();
  for (const r of withDate) {
    const key = (formatObjektAdresaOneLine(r) || r.id).trim().toLowerCase();
    const existing = latestByBuilding.get(key);
    if (!existing || r.datum_zahajeni > existing.datum_zahajeni) {
      latestByBuilding.set(key, r);
    }
  }

  const now = new Date();
  return Array.from(latestByBuilding.values())
    .map((r) => {
      const interval = getRevisionInterval(r.trida_lps, type);
      const nextRevisionDate = addYears(new Date(r.datum_zahajeni), interval);
      const daysRemaining = differenceInDays(nextRevisionDate, now);
      return {
        id: r.id,
        ev_cislo_zpravy: r.ev_cislo_zpravy,
        adresa_zobrazeni: formatObjektAdresaOneLine(r),
        objednatel_revize: r.objednatel_revize,
        trida_lps: r.trida_lps,
        datum_zahajeni: r.datum_zahajeni,
        nextRevisionDate,
        daysRemaining,
        urgency: getUrgency(daysRemaining),
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

function PaginationControls({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <span className="text-sm text-muted-foreground">Strana {page + 1} z {totalPages}</span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ReportDeadlines() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: reports, isLoading } = useReportsQuery();

  const officialDeadlines = useMemo(() => reports ? buildDeadlineRows(reports, "official") : [], [reports]);
  const visualDeadlines = useMemo(() => reports ? buildDeadlineRows(reports, "visual") : [], [reports]);

  const overdueOfficialCount = officialDeadlines.filter(d => d.urgency === "overdue").length;
  const overdueVisualCount = visualDeadlines.filter(d => d.urgency === "overdue").length;

  const officialByUrgency = useMemo(() => ({
    overdue: officialDeadlines.filter(d => d.urgency === "overdue").length,
    urgent: officialDeadlines.filter(d => d.urgency === "urgent").length,
    upcoming: officialDeadlines.filter(d => d.urgency === "upcoming").length,
    ok: officialDeadlines.filter(d => d.urgency === "ok").length,
  }), [officialDeadlines]);

  const visualByUrgency = useMemo(() => ({
    overdue: visualDeadlines.filter(d => d.urgency === "overdue").length,
    urgent: visualDeadlines.filter(d => d.urgency === "urgent").length,
    upcoming: visualDeadlines.filter(d => d.urgency === "upcoming").length,
    ok: visualDeadlines.filter(d => d.urgency === "ok").length,
  }), [visualDeadlines]);

  const upcomingDeadlineChartData = useMemo(() => {
    const now = new Date();
    const result: { month: string; radna: number; vizualni: number }[] = [];
    const bucketStart = startOfMonth(now);
    for (let i = 0; i < 12; i++) {
      const mStart = addMonths(bucketStart, i);
      const mEnd = addMonths(mStart, 1);
      result.push({
        month: format(mStart, "LLL yy", { locale: cs }),
        radna: officialDeadlines.filter(d => d.nextRevisionDate >= mStart && d.nextRevisionDate < mEnd).length,
        vizualni: visualDeadlines.filter(d => d.nextRevisionDate >= mStart && d.nextRevisionDate < mEnd).length,
      });
    }
    const overdueRadna = officialDeadlines.filter(d => d.nextRevisionDate < bucketStart).length;
    const overdueViz = visualDeadlines.filter(d => d.nextRevisionDate < bucketStart).length;
    if (overdueRadna > 0 || overdueViz > 0) {
      result.unshift({ month: "Po termínu", radna: overdueRadna, vizualni: overdueViz });
    }
    return result;
  }, [officialDeadlines, visualDeadlines]);

  const handleExport = async (id: string) => {
    try {
      const { data: report } = await supabase.from("inspection_reports").select("*").eq("id", id).single();
      const { data: instruments } = await supabase.from("report_instruments").select("*").eq("report_id", id).order("sort_order");
      const { data: measurements } = await supabase.from("report_measurements").select("*").eq("report_id", id).order("sort_order");
      const { data: spdDevices } = await supabase.from("report_spd_devices").select("*").eq("report_id", id).order("sort_order");
      if (report) {
        generatePDF(report, (instruments || []) as Instrument[], (measurements || []) as Measurement[], (spdDevices || []) as SpdDevice[]);
      }
    } catch {
      toast({ title: "Chyba", description: "Nepodařilo se exportovat zprávu.", variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Termíny revizí</h1>
        <p className="text-muted-foreground mt-1">Přehled nadcházejících termínů řádných a vizuálních revizí</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="w-4 h-4" />
              Nadcházející termíny revizí
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                radna: { label: "Řádná revize", color: "hsl(var(--primary))" },
                vizualni: { label: "Vizuální revize", color: "hsl(25 95% 53%)" },
              }}
              className="h-[320px] w-full"
            >
              <BarChart data={upcomingDeadlineChartData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="radna" name="Řádná revize" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="vizualni" name="Vizuální revize" fill="hsl(25 95% 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="grid grid-rows-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-primary">{officialDeadlines.length}</span>
                <span className="text-sm text-muted-foreground">Řádné revize</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {(Object.keys(URGENCY_CONFIG) as UrgencyStatus[]).map((s) => (
                  <div key={s} className="flex items-center gap-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${URGENCY_CONFIG[s].className.split(" ")[0]}`} />
                    <span className="text-sm font-semibold">{officialByUrgency[s]}</span>
                    <span className="text-xs text-muted-foreground">{URGENCY_CONFIG[s].label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-orange-500" />
                <span className="text-2xl font-bold text-orange-500">{visualDeadlines.length}</span>
                <span className="text-sm text-muted-foreground">Vizuální revize</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {(Object.keys(URGENCY_CONFIG) as UrgencyStatus[]).map((s) => (
                  <div key={s} className="flex items-center gap-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${URGENCY_CONFIG[s].className.split(" ")[0]}`} />
                    <span className="text-sm font-semibold">{visualByUrgency[s]}</span>
                    <span className="text-xs text-muted-foreground">{URGENCY_CONFIG[s].label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="radna" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="radna" className="gap-1.5">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Řádná revize</span>
            {overdueOfficialCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1">
                {overdueOfficialCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="vizualni" className="gap-1.5">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Vizuální revize</span>
            {overdueVisualCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1">
                {overdueVisualCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="radna">
          <DeadlineView rows={officialDeadlines} type="official" isLoading={isLoading} onExport={handleExport} onEdit={(id) => navigate(`/report/${id}/edit`)} onView={(id) => navigate(`/report/${id}`)} />
        </TabsContent>
        <TabsContent value="vizualni">
          <DeadlineView rows={visualDeadlines} type="visual" isLoading={isLoading} onExport={handleExport} onEdit={(id) => navigate(`/report/${id}/edit`)} onView={(id) => navigate(`/report/${id}`)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DeadlineView({ rows, type, isLoading, onExport, onEdit, onView }: {
  rows: DeadlineRow[]; type: RevisionType; isLoading: boolean; onExport: (id: string) => void; onEdit?: (id: string) => void; onView?: (id: string) => void;
}) {
  const [page, setPage] = useState(0);
  const [activeFilters, setActiveFilters] = useState<Set<UrgencyStatus>>(new Set(["overdue", "urgent", "upcoming", "ok"]));
  const title = type === "official" ? "Termíny řádných revizí" : "Termíny vizuálních revizí";
  const description = type === "official"
    ? "Třída I, II: každé 2 roky | Třída III, IV: každé 4 roky"
    : "Všechny třídy: každý rok";
  const Icon = type === "official" ? Shield : Eye;

  const filteredRows = rows.filter((r) => activeFilters.has(r.urgency));
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filteredRows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const toggleFilter = (status: UrgencyStatus) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) { if (next.size > 1) next.delete(status); } else { next.add(status); }
      setPage(0);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {(Object.keys(URGENCY_CONFIG) as UrgencyStatus[]).map((status) => {
            const cfg = URGENCY_CONFIG[status];
            const count = rows.filter((r) => r.urgency === status).length;
            const isActive = activeFilters.has(status);
            return (
              <button key={status} onClick={() => toggleFilter(status)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${isActive ? cfg.className : "bg-muted text-muted-foreground opacity-50"}`}>
                {cfg.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${isActive ? "bg-white/20" : "bg-foreground/10"}`}>{count}</span>
              </button>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Načítání...</div>
        ) : !rows.length ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Žádné revize k zobrazení</p>
            <p className="text-sm text-muted-foreground mt-1">Revize se zde zobrazí po zadání data zahájení a třídy LPS.</p>
          </div>
        ) : !filteredRows.length ? (
          <div className="p-8 text-center text-muted-foreground">Žádné revize pro zvolený filtr</div>
        ) : (<>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objekt</TableHead>
                <TableHead className="hidden md:table-cell">Ev. č. zprávy</TableHead>
                <TableHead className="hidden lg:table-cell">Třída LPS</TableHead>
                <TableHead className="hidden lg:table-cell">Datum revize</TableHead>
                <TableHead>Příští revize</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Zbývá</TableHead>
                <TableHead>Stav</TableHead>
                <TableHead className="text-right">Akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((row) => (
                <TableRow key={row.id} className={row.urgency === "overdue" ? "bg-red-50/50 dark:bg-red-950/20" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium">{row.adresa_zobrazeni || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="font-mono text-primary">{row.ev_cislo_zpravy || "—"}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell font-semibold">{row.trida_lps || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {format(new Date(row.datum_zahajeni), "dd.MM.yyyy", { locale: cs })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      {format(row.nextRevisionDate, "dd.MM.yyyy", { locale: cs })}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right tabular-nums">
                    {row.daysRemaining < 0
                      ? <span className="text-red-600 font-semibold">{row.daysRemaining} dní</span>
                      : <span>{row.daysRemaining} dní</span>}
                  </TableCell>
                  <TableCell>
                    <Badge className={URGENCY_CONFIG[row.urgency].className}>{URGENCY_CONFIG[row.urgency].label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {onView && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(row.id)} title="Zobrazit">
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(row.id)}>
                              <Pencil className="w-4 h-4 mr-2" /> Upravit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onExport(row.id)}>
                            <Download className="w-4 h-4 mr-2" /> Stáhnout PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls page={safePage} totalPages={totalPages} onPageChange={setPage} />
        </>)}
      </CardContent>
    </Card>
  );
}
