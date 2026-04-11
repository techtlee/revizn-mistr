import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatObjektAdresaOneLine } from "@/lib/objectAddress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Shield,
  Eye,
} from "lucide-react";
import {
  addDays,
  addMonths,
  addYears,
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { cs } from "date-fns/locale";

const WEEKDAY_LABELS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

function getRevisionInterval(tridaLps: string | null, type: "official" | "visual"): number {
  if (type === "visual") return 1;
  if (tridaLps === "I" || tridaLps === "II") return 2;
  return 4;
}

interface DeadlineEvent {
  id: string;
  address: string;
  evCislo: string | null;
  tridaLps: string | null;
  date: Date;
  daysRemaining: number;
  type: "official" | "visual";
}

export default function CalendarView() {
  const navigate = useNavigate();
  const [viewMonth, setViewMonth] = useState(startOfMonth(new Date()));

  const { data: reports } = useQuery({
    queryKey: ["reports-calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspection_reports")
        .select("id, ev_cislo_zpravy, adresa_ulice, adresa_obec, adresa_psc, adresa_doplnek, datum_zahajeni, trida_lps, created_at")
        .or("status.eq.complete,status.is.null")
        .order("datum_zahajeni", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const events: DeadlineEvent[] = useMemo(() => {
    if (!reports) return [];
    const now = new Date();
    const withDate = reports.filter((r) => r.datum_zahajeni);

    const latestByBuilding = new Map<string, (typeof withDate)[number]>();
    for (const r of withDate) {
      const key = (formatObjektAdresaOneLine(r) || r.id).trim().toLowerCase();
      const existing = latestByBuilding.get(key);
      if (!existing || r.datum_zahajeni! > existing.datum_zahajeni!) {
        latestByBuilding.set(key, r);
      }
    }

    const result: DeadlineEvent[] = [];
    for (const r of latestByBuilding.values()) {
      for (const type of ["official", "visual"] as const) {
        const interval = getRevisionInterval(r.trida_lps, type);
        const date = addYears(new Date(r.datum_zahajeni!), interval);
        result.push({
          id: r.id,
          address: formatObjektAdresaOneLine(r),
          evCislo: r.ev_cislo_zpravy,
          tridaLps: r.trida_lps,
          date,
          daysRemaining: differenceInDays(date, now),
          type,
        });
      }
    }
    return result;
  }, [reports]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);

  // Monday = 0 for grid alignment
  const startDow = (getDay(monthStart) + 6) % 7;
  const gridStart = addDays(monthStart, -startDow);
  const gridDays = eachDayOfInterval({ start: gridStart, end: addDays(gridStart, 41) });

  const eventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(e.date, day));

  const monthEvents = events
    .filter((e) => e.date >= monthStart && e.date <= monthEnd)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Kalendář</h1>
        <p className="text-muted-foreground mt-1">Přehled nadcházejících termínů revizí</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* Calendar grid */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setViewMonth(subMonths(viewMonth, 1))}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <CardTitle className="text-lg capitalize">
                {format(viewMonth, "LLLL yyyy", { locale: cs })}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setViewMonth(addMonths(viewMonth, 1))}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {WEEKDAY_LABELS.map((d) => (
                <div key={d} className="bg-muted py-2 text-center text-xs font-medium text-muted-foreground">
                  {d}
                </div>
              ))}
              {gridDays.map((day) => {
                const dayEvents = eventsForDay(day);
                const isCurrentMonth = isSameMonth(day, viewMonth);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={`bg-card min-h-[80px] p-1.5 ${!isCurrentMonth ? "opacity-30" : ""}`}
                  >
                    <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((e, i) => {
                        const overdue = e.daysRemaining < 0;
                        const urgent = e.daysRemaining >= 0 && e.daysRemaining <= 90;
                        const bg = overdue
                          ? "bg-red-500"
                          : urgent
                          ? "bg-amber-500"
                          : e.type === "visual"
                          ? "bg-orange-400"
                          : "bg-primary";

                        return (
                          <button
                            key={`${e.id}-${e.type}-${i}`}
                            className={`block w-full text-left rounded px-1 py-0.5 text-[10px] text-white truncate ${bg} hover:opacity-80 transition-opacity`}
                            onClick={() => navigate(`/report/${e.id}/edit`)}
                            title={`${e.address} (${e.type === "official" ? "řádná" : "vizuální"})`}
                          >
                            {e.type === "official" ? "⚡" : "👁"} {e.address?.split(",")[0] || e.evCislo || "—"}
                          </button>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-muted-foreground pl-1">
                          +{dayEvents.length - 3} dalších
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-500" /> Po termínu
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500" /> Do 90 dní
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-primary" /> Řádná revize
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-orange-400" /> Vizuální revize
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Month event list */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="w-5 h-5" />
              Termíny v měsíci
              {monthEvents.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">({monthEvents.length})</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {monthEvents.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                Žádné termíny v tomto měsíci
              </div>
            ) : (
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {monthEvents.map((e, i) => {
                  const overdue = e.daysRemaining < 0;
                  const urgent = e.daysRemaining >= 0 && e.daysRemaining <= 90;
                  const Icon = e.type === "official" ? Shield : Eye;

                  return (
                    <div
                      key={`${e.id}-${e.type}-${i}`}
                      className={`px-4 py-3 hover:bg-muted/50 cursor-pointer ${overdue ? "bg-red-50/50 dark:bg-red-950/20" : ""}`}
                      onClick={() => navigate(`/report/${e.id}/edit`)}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${e.type === "official" ? "text-primary" : "text-orange-500"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{e.address || "—"}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {format(e.date, "d. M.", { locale: cs })}
                            </span>
                            {overdue ? (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                {e.daysRemaining}d
                              </Badge>
                            ) : urgent ? (
                              <Badge className="bg-amber-500 text-white border-0 text-[10px] px-1.5 py-0">
                                {e.daysRemaining}d
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">{e.daysRemaining}d</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
