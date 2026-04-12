import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatObjektAdresaOneLine, objectAddressSearchText } from "@/lib/objectAddress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Zap, Plus, Search, FileText, Calendar, User, Building2,
  Pencil, Trash2, Download, ChevronLeft, ChevronRight, Eye, MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useReportsQuery } from "@/hooks/useReportsQuery";
import { generatePDF } from "@/lib/pdfExport";

import type { Tables } from "@/integrations/supabase/types";
type Instrument = Tables<"report_instruments">;
type Measurement = Tables<"report_measurements">;
type SpdDevice = Tables<"report_spd_devices">;

const PAGE_SIZE = 10;

function PaginationControls({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <span className="text-sm text-muted-foreground">
        Strana {page + 1} z {totalPages}
      </span>
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

export default function ReportList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDatumOd, setFilterDatumOd] = useState("");
  const [filterDatumDo, setFilterDatumDo] = useState("");
  const [filterPosudek, setFilterPosudek] = useState<string>("all");
  const [filterDruh, setFilterDruh] = useState<string>("all");
  const [reportPage, setReportPage] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { data: reports, isLoading, refetch } = useReportsQuery();

  const filtered = reports?.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        r.ev_cislo_zpravy?.toLowerCase().includes(q) ||
        r.objednatel_revize?.toLowerCase().includes(q) ||
        objectAddressSearchText(r).includes(q);
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
    if (!await confirm({ title: "Smazat revizní zprávu", description: "Opravdu chcete smazat tuto revizní zprávu? Tuto akci nelze vrátit zpět.", confirmLabel: "Smazat", variant: "destructive" })) return;
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
          (spdDevices || []) as SpdDevice[],
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Seznam zpráv</h1>
        <p className="text-muted-foreground mt-1">Dokončené revizní zprávy dle ČSN EN 62305</p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Hledat dle čísla zprávy, objednavatele nebo adresy..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setReportPage(0); }}
            className="pl-10 h-11"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground shrink-0">Datum od</Label>
            <Input type="date" value={filterDatumOd} onChange={(e) => { setFilterDatumOd(e.target.value); setReportPage(0); }} className="h-9 w-[140px]" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground shrink-0">Datum do</Label>
            <Input type="date" value={filterDatumDo} onChange={(e) => { setFilterDatumDo(e.target.value); setReportPage(0); }} className="h-9 w-[140px]" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground shrink-0">Posudek</Label>
            <Select value={filterPosudek} onValueChange={(v) => { setFilterPosudek(v); setReportPage(0); }}>
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
            <Select value={filterDruh} onValueChange={(v) => { setFilterDruh(v); setReportPage(0); }}>
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
            Revizní zprávy
            {filtered && <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>}
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
              {!searchQuery && !filterDatumOd && !filterDatumDo && filterPosudek === "all" && filterDruh === "all" && (
                <Button className="mt-4" onClick={() => navigate("/report/new")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Vytvořit první zprávu
                </Button>
              )}
            </div>
          ) : (() => {
            const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
            const safeReportPage = Math.min(reportPage, totalPages - 1);
            const paged = filtered.slice(safeReportPage * PAGE_SIZE, (safeReportPage + 1) * PAGE_SIZE);
            return <>
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
                {paged.map((report) => (
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
                        {formatObjektAdresaOneLine(report) || "—"}
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/report/${report.id}`)} title="Zobrazit">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/report/${report.id}/edit`)}>
                              <Pencil className="w-4 h-4 mr-2" /> Upravit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport(report.id)}>
                              <Download className="w-4 h-4 mr-2" /> Stáhnout PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(report.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Smazat
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls page={safeReportPage} totalPages={totalPages} onPageChange={setReportPage} />
            </>;
          })()}
        </CardContent>
      </Card>
      <ConfirmDialog />
    </div>
  );
}
