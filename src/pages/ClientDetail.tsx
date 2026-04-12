import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useClientQuery, useClientReports, useUpsertClient, findDuplicateClient } from "@/hooks/useClients";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { formatObjektAdresaOneLine } from "@/lib/objectAddress";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Plus,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

const CLIENT_TYPES = [
  { value: "objednatel", label: "Objednatel revize" },
  { value: "majitel", label: "Majitel objektu" },
  { value: "provozovatel", label: "Provozovatel objektu" },
];

function emptyClient(): Partial<Client> {
  return {
    name: "",
    ico: "",
    address_street: "",
    address_city: "",
    address_zip: "",
    email: "",
    phone: "",
    contact_person: "",
    notes: "",
    client_type: [],
  };
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const upsert = useUpsertClient();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const { data: existing, isLoading } = useClientQuery(isNew ? undefined : id);
  const { data: reports } = useClientReports(isNew ? undefined : id);
  const [form, setForm] = useState<Partial<Client>>(emptyClient);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (existing && !loaded) {
      setForm(existing);
      setLoaded(true);
    }
  }, [existing, loaded]);

  const set = <K extends keyof Client>(key: K, value: Client[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleType = (type: string) => {
    const current = form.client_type ?? [];
    if (current.includes(type)) {
      set("client_type", current.filter((t) => t !== type));
    } else {
      set("client_type", [...current, type]);
    }
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast({ title: "Chyba", description: "Jméno / firma je povinné.", variant: "destructive" });
      return;
    }
    try {
      if (isNew) {
        const dup = await findDuplicateClient(form.ico, form.name!);
        if (dup) {
          const matchField = dup.ico && form.ico && dup.ico === form.ico.trim() ? `IČO ${dup.ico}` : `jménem „${dup.name}"`;
          const proceed = await confirm({
            title: "Podobný klient již existuje",
            description: `Klient se shodným ${matchField} je již evidován. Chcete přesto vytvořit nového klienta, nebo přejít na existující záznam?`,
            confirmLabel: "Vytvořit nového",
            cancelLabel: "Zobrazit existujícího",
          });
          if (!proceed) {
            navigate(`/clients/${dup.id}`);
            return;
          }
        }
        await upsert.mutateAsync({ ...form, name: form.name!, created_by: user?.id ?? null });
      } else {
        await upsert.mutateAsync({ ...form, id: id!, name: form.name! });
      }
      toast({ title: "Uloženo", description: isNew ? "Klient byl vytvořen." : "Klient byl aktualizován." });
      navigate("/clients");
    } catch {
      toast({ title: "Chyba", description: "Nepodařilo se uložit klienta.", variant: "destructive" });
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/clients" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-1">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Zpět na klienty</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {isNew ? "Nový klient" : form.name || "Detail klienta"}
          </h1>
        </div>
        <Button size="sm" onClick={handleSave} disabled={upsert.isPending}>
          {upsert.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          {isNew ? "Vytvořit" : "Uložit změny"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Základní údaje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Jméno / Firma *</Label>
              <Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>IČO</Label>
                <Input value={form.ico ?? ""} onChange={(e) => set("ico", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Kontaktní osoba</Label>
                <Input value={form.contact_person ?? ""} onChange={(e) => set("contact_person", e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Typ klienta</Label>
              <div className="flex flex-wrap gap-4">
                {CLIENT_TYPES.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={(form.client_type ?? []).includes(value)}
                      onCheckedChange={() => toggleType(value)}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adresa a poznámky</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Ulice</Label>
              <Input value={form.address_street ?? ""} onChange={(e) => set("address_street", e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <div>
                <Label>Obec</Label>
                <Input value={form.address_city ?? ""} onChange={(e) => set("address_city", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>PSČ</Label>
                <Input value={form.address_zip ?? ""} onChange={(e) => set("address_zip", e.target.value)} className="mt-1 w-28" />
              </div>
            </div>
            <div>
              <Label>Poznámky</Label>
              <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} className="mt-1" rows={4} />
            </div>
          </CardContent>
        </Card>
      </div>

      {!isNew && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-5 h-5" />
                Revizní zprávy klienta
                {reports && <span className="text-sm font-normal text-muted-foreground">({reports.length})</span>}
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => navigate(`/report/new?client=${id}`)}>
                <Plus className="w-4 h-4 mr-1" />
                Nová revize
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!reports?.length ? (
              <div className="p-8 text-center text-muted-foreground">
                Žádné revizní zprávy pro tohoto klienta
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ev. č. zprávy</TableHead>
                    <TableHead className="hidden md:table-cell">Adresa objektu</TableHead>
                    <TableHead className="hidden lg:table-cell">Datum</TableHead>
                    <TableHead>Posudek</TableHead>
                    <TableHead className="text-right">Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <span className="font-mono font-semibold text-primary">
                          {report.ev_cislo_zpravy || "—"}
                        </span>
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
                      <TableCell>
                        {report.celkovy_posudek === "v souladu" ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600/90 text-white border-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> V souladu
                          </Badge>
                        ) : report.celkovy_posudek === "není v souladu" ? (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" /> Není v souladu
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Bez posudku</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/report/${report.id}`)}
                          title="Zobrazit"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
      <ConfirmDialog />
    </div>
  );
}
