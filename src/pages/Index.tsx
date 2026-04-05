import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Zap,
  Plus,
  Search,
  FileText,
  Calendar,
  User,
  Building2,
  Pencil,
  Trash2,
  Download,
  BarChart3,
  PieChart,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  Library,
  ChevronDown,
  ClipboardList,
  ListTree,
  SlidersHorizontal,
} from "lucide-react";
import { format, startOfMonth, subMonths } from "date-fns";
import { cs } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/lib/pdfExport";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Pie, PieChart as RechartsPieChart, Cell } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Tables } from "@/integrations/supabase/types";
type Instrument = Tables<"report_instruments">;
type Measurement = Tables<"report_measurements">;
type SpdDevice = Tables<"report_spd_devices">;

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDatumOd, setFilterDatumOd] = useState("");
  const [filterDatumDo, setFilterDatumDo] = useState("");
  const [filterPosudek, setFilterPosudek] = useState<string>("all");
  const [filterDruh, setFilterDruh] = useState<string>("all");
  const { user, signOut } = useAuth();
  const isAdmin = !!user;
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspection_reports")
        .select("id, ev_cislo_zpravy, objednatel_revize, nazev_adresa_objektu, datum_zahajeni, celkovy_posudek, revizni_technik, typ_revize, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = reports?.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        r.ev_cislo_zpravy?.toLowerCase().includes(q) ||
        r.objednatel_revize?.toLowerCase().includes(q) ||
        r.nazev_adresa_objektu?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    if (filterDatumOd || filterDatumDo) {
      const date = r.datum_zahajeni ? new Date(r.datum_zahajeni) : r.created_at ? new Date(r.created_at) : null;
      if (!date) return false;
      if (filterDatumOd && date < new Date(filterDatumOd + "T00:00:00")) return false;
      if (filterDatumDo && date > new Date(filterDatumDo + "T23:59:59")) return false;
    }
    if (filterPosudek !== "all") {
      if (filterPosudek === "ok" && r.celkovy_posudek !== "v souladu") return false;
      if (filterPosudek === "bad" && r.celkovy_posudek !== "není v souladu") return false;
      if (filterPosudek === "none" && (r.celkovy_posudek === "v souladu" || r.celkovy_posudek === "není v souladu")) return false;
    }
    if (filterDruh !== "all" && r.typ_revize !== filterDruh) return false;
    return true;
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
      const { data: report } = await supabase.from("inspection_reports").select("*").eq("id", id).single();
      const { data: instruments } = await supabase.from("report_instruments").select("*").eq("report_id", id).order("sort_order");
      const { data: measurements } = await supabase.from("report_measurements").select("*").eq("report_id", id).order("sort_order");
      const { data: spdDevices } = await supabase.from("report_spd_devices").select("*").eq("report_id", id).order("sort_order");

      if (report) {
        generatePDF(
          report,
          (instruments || []) as Instrument[],
          (measurements || []) as Measurement[],
          (spdDevices || []) as SpdDevice[]
        );
      }
    } catch {
      toast({ title: "Chyba", description: "Nepodařilo se exportovat zprávu.", variant: "destructive" });
    }
  };

  const posudekBadge = (posudek: string | null) => {
    if (posudek === "v souladu")
      return { variant: "default" as const, className: "bg-emerald-600 hover:bg-emerald-600/90 text-white border-0" };
    if (posudek === "není v souladu")
      return { variant: "destructive" as const, className: "" };
    return { variant: "outline" as const, className: "text-muted-foreground" };
  };

  const posudekShort = (posudek: string | null) => {
    if (posudek === "v souladu") return "V souladu";
    if (posudek === "není v souladu") return "Není v souladu";
    return "Bez posudku";
  };

  const posudekChartData = useMemo(() => {
    if (!reports) return [];
    const ok = reports.filter(r => r.celkovy_posudek === "v souladu").length;
    const bad = reports.filter(r => r.celkovy_posudek === "není v souladu").length;
    const none = reports.length - ok - bad;
    return [
      { name: "V souladu", value: ok, color: "hsl(142 71% 45%)" },
      { name: "Není v souladu", value: bad, color: "hsl(0 72% 51%)" },
      { name: "Bez posudku", value: none, color: "hsl(215 15% 50%)" },
    ].filter(d => d.value > 0);
  }, [reports]);

  const monthlyChartData = useMemo(() => {
    if (!reports) return [];
    const months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d);
      const count = reports.filter(r => {
        const date = r.datum_zahajeni ? new Date(r.datum_zahajeni) : r.created_at ? new Date(r.created_at) : null;
        if (!date) return false;
        const reportMonth = startOfMonth(date);
        return reportMonth.getTime() === start.getTime();
      }).length;
      months.push({ month: format(start, "MMM yyyy", { locale: cs }), count });
    }
    return months;
  }, [reports]);

  return (
    <div className="min-h-screen bg-background">
      <nav className="nav-bar">
        <Link to="/" className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-[hsl(44,84%,51%)]" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm sm:text-base text-foreground tracking-wide uppercase">Vitmajer</span>
            <span className="text-[10px] text-muted-foreground tracking-widest hidden sm:block">Hromosvody</span>
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {isAdmin && (
            <>
              <div className="flex items-center">
                <Button variant="outline" size="sm" className="text-sm rounded-r-none border-r-0 pr-2 sm:pr-3" asChild>
                  <Link to="/settings">
                    <Library className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Knihovna</span>
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-sm rounded-l-none px-2" aria-label="Rychlý vstup do knihovny">
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Knihovna — rychlý vstup</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <Library className="w-4 h-4 mr-2" />
                        Přehled
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings/firmy" className="cursor-pointer">
                        <Building2 className="w-4 h-4 mr-2" />
                        Montážní firmy
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings/pristroje" className="cursor-pointer">
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Přístroje
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings/sablony-popisu" className="cursor-pointer">
                        <FileText className="w-4 h-4 mr-2" />
                        Šablony popisu
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings/zavady" className="cursor-pointer">
                        <ListTree className="w-4 h-4 mr-2" />
                        Časté závady
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings/vychozi-hodnoty" className="cursor-pointer">
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        Výchozí hodnoty
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button onClick={() => navigate("/report/new")} size="sm" className="text-sm">
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Nová revize</span>
                <span className="sm:hidden">Nová</span>
              </Button>
            </>
          )}
          {isAdmin ? (
            <Button variant="outline" size="sm" onClick={() => signOut()} className="text-sm">
              <LogOut className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Odhlásit</span>
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate("/login")} className="text-sm">
              <LogIn className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Přihlášení</span>
            </Button>
          )}
        </div>
      </nav>

      <div className="page-content">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Revizní zprávy LPS</h1>
          <p className="text-muted-foreground mt-1">Hromosvody Vitmajer – správa revizí dle ČSN EN 62305</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{reports?.length ?? 0}</div>
              <p className="text-sm text-muted-foreground mt-1">Celkem zpráv</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-2xl font-bold text-emerald-600">
                  {reports?.filter(r => r.celkovy_posudek === "v souladu").length ?? 0}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">V souladu</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                <span className="text-2xl font-bold text-destructive">
                  {reports?.filter(r => r.celkovy_posudek === "není v souladu").length ?? 0}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Není v souladu</p>
            </CardContent>
          </Card>
        </div>

        {reports && reports.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {posudekChartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <PieChart className="w-4 h-4" />
                    Rozložení posudků
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      ok: { label: "V souladu", color: "hsl(142 71% 45%)" },
                      bad: { label: "Není v souladu", color: "hsl(0 72% 51%)" },
                      none: { label: "Bez posudku", color: "hsl(215 15% 50%)" },
                    }}
                    className="h-[240px] w-full"
                  >
                    <RechartsPieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={posudekChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {posudekChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <BarChart3 className="w-4 h-4" />
                  Revize podle měsíce
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: { label: "Počet revizí", color: "hsl(221 100% 50%)" },
                  }}
                  className="h-[240px] w-full"
                >
                  <BarChart data={monthlyChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Hledat dle čísla zprávy, objednavatele nebo adresy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground shrink-0">Datum od</Label>
              <Input type="date" value={filterDatumOd} onChange={(e) => setFilterDatumOd(e.target.value)} className="h-9 w-[140px]" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground shrink-0">Datum do</Label>
              <Input type="date" value={filterDatumDo} onChange={(e) => setFilterDatumDo(e.target.value)} className="h-9 w-[140px]" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground shrink-0">Posudek</Label>
              <Select value={filterPosudek} onValueChange={setFilterPosudek}>
                <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Vše" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vše</SelectItem>
                  <SelectItem value="ok">V souladu</SelectItem>
                  <SelectItem value="bad">Není v souladu</SelectItem>
                  <SelectItem value="none">Bez posudku</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground shrink-0">Druh</Label>
              <Select value={filterDruh} onValueChange={setFilterDruh}>
                <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Vše" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vše</SelectItem>
                  <SelectItem value="výchozí">Výchozí</SelectItem>
                  <SelectItem value="pravidelná">Pravidelná</SelectItem>
                  <SelectItem value="mimořádná">Mimořádná</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(filterDatumOd || filterDatumDo || filterPosudek !== "all" || filterDruh !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground"
                onClick={() => {
                  setFilterDatumOd("");
                  setFilterDatumDo("");
                  setFilterPosudek("all");
                  setFilterDruh("all");
                }}
              >
                Zrušit filtry
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Seznam revizních zpráv
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground">Načítání...</div>
            ) : !filtered?.length ? (
              <div className="p-12 text-center">
                <Zap className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">
                  {searchQuery || filterDatumOd || filterDatumDo || filterPosudek !== "all" || filterDruh !== "all"
                    ? "Žádné výsledky pro zvolené filtry"
                    : "Zatím žádné revizní zprávy"}
                </p>
                {!searchQuery && !filterDatumOd && !filterDatumDo && filterPosudek === "all" && filterDruh === "all" && isAdmin && (
                  <Button className="mt-4" onClick={() => navigate("/report/new")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Vytvořit první zprávu
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ev. č. zprávy</TableHead>
                    <TableHead>Objednatel</TableHead>
                    <TableHead className="hidden md:table-cell">Adresa objektu</TableHead>
                    <TableHead className="hidden lg:table-cell">Datum</TableHead>
                    <TableHead className="hidden lg:table-cell">Druh</TableHead>
                    <TableHead>Posudek</TableHead>
                    <TableHead className="text-right">Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <span className="font-mono font-semibold text-primary">
                          {report.ev_cislo_zpravy || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>{report.objednatel_revize || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          {report.nazev_adresa_objektu || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          {report.datum_zahajeni
                            ? format(new Date(report.datum_zahajeni), "dd.MM.yyyy", { locale: cs })
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell capitalize">
                        {report.typ_revize || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={posudekBadge(report.celkovy_posudek).variant} className={posudekBadge(report.celkovy_posudek).className}>
                          {posudekShort(report.celkovy_posudek)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExport(report.id)} title="Exportovat PDF">
                            <Download className="w-4 h-4" />
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/report/${report.id}/edit`)} title="Upravit">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(report.id)} title="Smazat">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
