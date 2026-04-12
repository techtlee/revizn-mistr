import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CheckCircle2, XCircle, ClipboardList, TrendingUp } from "lucide-react";
import { format, startOfMonth, subMonths } from "date-fns";
import { cs } from "date-fns/locale";
import { useReportsQuery } from "@/hooks/useReportsQuery";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

export default function ReportStats() {
  const { data: reports, isLoading } = useReportsQuery();

  const monthlyStackedData = useMemo(() => {
    if (!reports) return [];
    const result: { month: string; ok: number; bad: number; none: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d);
      const inMonth = reports.filter(r => {
        const date = r.datum_zahajeni ? new Date(r.datum_zahajeni) : r.created_at ? new Date(r.created_at) : null;
        if (!date) return false;
        return startOfMonth(date).getTime() === start.getTime();
      });
      result.push({
        month: format(start, "LLL yy", { locale: cs }),
        ok: inMonth.filter(r => r.celkovy_posudek === "v souladu").length,
        bad: inMonth.filter(r => r.celkovy_posudek === "není v souladu").length,
        none: inMonth.filter(r => r.celkovy_posudek !== "v souladu" && r.celkovy_posudek !== "není v souladu").length,
      });
    }
    return result;
  }, [reports]);

  const byType = useMemo(() => {
    if (!reports) return [];
    const counts = new Map<string, number>();
    for (const r of reports) {
      const key = r.typ_revize || "Neuvedeno";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [reports]);

  const totalOk = reports?.filter(r => r.celkovy_posudek === "v souladu").length ?? 0;
  const totalBad = reports?.filter(r => r.celkovy_posudek === "není v souladu").length ?? 0;
  const totalNone = (reports?.length ?? 0) - totalOk - totalBad;

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Statistiky</h1>
          <p className="text-muted-foreground mt-1">Přehled revizních zpráv</p>
        </div>
        <div className="p-12 text-center text-muted-foreground">Načítání...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Statistiky</h1>
        <p className="text-muted-foreground mt-1">Souhrnný přehled revizních zpráv</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Celkem zpráv</span>
            </div>
            <div className="text-3xl font-bold text-primary">{reports?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-muted-foreground">V souladu</span>
            </div>
            <div className="text-3xl font-bold text-emerald-600">{totalOk}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Není v souladu</span>
            </div>
            <div className="text-3xl font-bold text-destructive">{totalBad}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Bez posudku</span>
            </div>
            <div className="text-3xl font-bold text-muted-foreground">{totalNone}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="w-4 h-4" />
              Revize podle měsíce a posudku
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                ok: { label: "V souladu", color: "hsl(142 71% 45%)" },
                bad: { label: "Není v souladu", color: "hsl(0 72% 51%)" },
                none: { label: "Bez posudku", color: "hsl(215 15% 50%)" },
              }}
              className="h-[320px] w-full"
            >
              <BarChart data={monthlyStackedData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="ok" name="V souladu" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bad" name="Není v souladu" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="none" name="Bez posudku" fill="hsl(215 15% 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ClipboardList className="w-4 h-4" />
              Podle druhu revize
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byType.map(({ name, count }) => {
                const pct = reports?.length ? Math.round((count / reports.length) * 100) : 0;
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{name}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {byType.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Žádná data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
