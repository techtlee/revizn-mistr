import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useMatch } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSavedInstrumentsQuery, useUpsertInstrumentTemplate } from "@/hooks/useLibrary";
import type { Tables } from "@/integrations/supabase/types";

type InstrumentFields = Pick<
  Tables<"saved_instrument_templates">,
  | "nazev_pristroje"
  | "typ_pristroje"
  | "vyrobni_cislo"
  | "cislo_kalibracniho_listu"
  | "datum_kalibrace"
  | "firma_kalibrace"
>;

const emptyFields = (): InstrumentFields => ({
  nazev_pristroje: null,
  typ_pristroje: null,
  vyrobni_cislo: null,
  cislo_kalibracniho_listu: null,
  datum_kalibrace: null,
  firma_kalibrace: null,
});

export default function InstrumentFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = useMatch({ path: "/library/pristroje/novy", end: true }) !== null;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: rows = [], isPending } = useSavedInstrumentsQuery();
  const upsert = useUpsertInstrumentTemplate();
  const [row, setRow] = useState<(InstrumentFields & { recordId?: string }) | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (isNew) {
      setRow({ ...emptyFields() });
      return;
    }
    if (id) {
      const found = rows.find(r => r.id === id);
      if (found) {
        setRow({
          recordId: found.id,
          nazev_pristroje: found.nazev_pristroje,
          typ_pristroje: found.typ_pristroje,
          vyrobni_cislo: found.vyrobni_cislo,
          cislo_kalibracniho_listu: found.cislo_kalibracniho_listu,
          datum_kalibrace: found.datum_kalibrace,
          firma_kalibrace: found.firma_kalibrace,
        });
      } else setRow(null);
    }
  }, [rows, id, isNew, isPending]);

  const save = () => {
    if (!row) return;
    upsert.mutate(
      {
        id: isNew ? undefined : row.recordId,
        nazev_pristroje: row.nazev_pristroje,
        typ_pristroje: row.typ_pristroje,
        vyrobni_cislo: row.vyrobni_cislo,
        cislo_kalibracniho_listu: row.cislo_kalibracniho_listu,
        datum_kalibrace: row.datum_kalibrace,
        firma_kalibrace: row.firma_kalibrace,
      },
      {
        onSuccess: () => {
          toast({ title: "Uloženo", description: isNew ? "Šablona přidána." : "Změny uloženy." });
          navigate("/library/pristroje");
        },
        onError: () => toast({ title: "Chyba ukládání", variant: "destructive" }),
      },
    );
  };

  if (isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isNew && id && !rows.some(r => r.id === id)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Záznam nenalezen</CardTitle>
          <CardDescription>
            <Button variant="link" className="px-0 h-auto" asChild>
              <Link to="/library/pristroje">Zpět na seznam</Link>
            </Button>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (row === null) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const set = (patch: Partial<InstrumentFields>) =>
    setRow(prev => (prev ? { ...prev, ...patch } : prev));

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" asChild>
        <Link to="/library/pristroje">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zpět na seznam
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "Nová šablona přístroje" : "Upravit šablonu"}</CardTitle>
          <CardDescription>Údaje vidí všichni uživatelé; upravit může autor záznamu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Název přístroje</Label>
              <Input
                className="mt-1"
                value={row.nazev_pristroje ?? ""}
                onChange={e => set({ nazev_pristroje: e.target.value || null })}
              />
            </div>
            <div>
              <Label>Typ</Label>
              <Input
                className="mt-1"
                value={row.typ_pristroje ?? ""}
                onChange={e => set({ typ_pristroje: e.target.value || null })}
              />
            </div>
            <div>
              <Label>Výrobní číslo</Label>
              <Input
                className="mt-1"
                value={row.vyrobni_cislo ?? ""}
                onChange={e => set({ vyrobni_cislo: e.target.value || null })}
              />
            </div>
            <div>
              <Label>Č. kalibračního listu</Label>
              <Input
                className="mt-1"
                value={row.cislo_kalibracniho_listu ?? ""}
                onChange={e => set({ cislo_kalibracniho_listu: e.target.value || null })}
              />
            </div>
            <div>
              <Label>Datum kalibrace</Label>
              <Input
                className="mt-1"
                value={row.datum_kalibrace ?? ""}
                onChange={e => set({ datum_kalibrace: e.target.value || null })}
              />
            </div>
            <div>
              <Label>Firma kalibrace</Label>
              <Input
                className="mt-1"
                value={row.firma_kalibrace ?? ""}
                onChange={e => set({ firma_kalibrace: e.target.value || null })}
              />
            </div>
          </div>
          <Button onClick={save} disabled={upsert.isPending}>
            {upsert.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Uložit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
