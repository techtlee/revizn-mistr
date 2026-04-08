import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { usePinnedDefaultsQuery, useUpsertPinnedDefaults } from "@/hooks/usePinnedDefaults";
import type { PinnedDefaults } from "@/lib/formSettings";

const TYP_REVIZE = [
  { value: "výchozí", label: "Výchozí" },
  { value: "pravidelná", label: "Pravidelná" },
  { value: "mimořádná", label: "Mimořádná" },
] as const;

const TRIDA_LPS = ["I", "II", "III", "IV"] as const;

export default function PinnedDefaultsPage() {
  const { toast } = useToast();
  const { data } = usePinnedDefaultsQuery();
  const upsert = useUpsertPinnedDefaults();
  const [draft, setDraft] = useState<PinnedDefaults | null>(null);

  useEffect(() => {
    if (data !== undefined) setDraft(data);
  }, [data]);

  const setPinned = (patch: Partial<PinnedDefaults>) => {
    setDraft(d => (d ? { ...d, ...patch } : d));
  };

  const save = () => {
    if (!draft) return;
    upsert.mutate(draft, {
      onSuccess: () => toast({ title: "Uloženo", description: "Výchozí hodnoty byly uloženy." }),
      onError: () => toast({ title: "Chyba", variant: "destructive" }),
    });
  };

  if (draft === null) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const p = draft;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Výchozí hodnoty pro nové revize</h2>
        <p className="text-sm text-muted-foreground">
          Po přihlášení se při vytvoření nové zprávy předvyplní tato pole (existující zprávy se nemění).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pole revize</CardTitle>
          <CardDescription>Volitelné výchozí údaje v hlavičce a rozsahu prohlídky.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Typ revize</Label>
              <Select
                value={p.typ_revize ?? "__none__"}
                onValueChange={v => setPinned({ typ_revize: v === "__none__" ? undefined : v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="(nevyplněno)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">(žádné)</SelectItem>
                  {TYP_REVIZE.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Třída LPS</Label>
              <Select
                value={p.trida_lps ?? "__none__"}
                onValueChange={v => setPinned({ trida_lps: v === "__none__" ? undefined : v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="(nevyplněno)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">(žádné)</SelectItem>
                  {TRIDA_LPS.map(t => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Revizní technik</Label>
            <Input
              className="mt-1"
              value={p.revizni_technik ?? ""}
              onChange={e => setPinned({ revizni_technik: e.target.value || undefined })}
            />
          </div>
          <div>
            <Label>Adresa revizního technika</Label>
            <Input
              className="mt-1"
              value={p.adresa_technika ?? ""}
              onChange={e => setPinned({ adresa_technika: e.target.value || undefined })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Ev. č. osvědčení</Label>
              <Input
                className="mt-1"
                value={p.ev_cislo_osvedceni ?? ""}
                onChange={e => setPinned({ ev_cislo_osvedceni: e.target.value || undefined })}
              />
            </div>
            <div>
              <Label>Ev. č. oprávnění (technik)</Label>
              <Input
                className="mt-1"
                value={p.ev_cislo_opravneni ?? ""}
                onChange={e => setPinned({ ev_cislo_opravneni: e.target.value || undefined })}
              />
            </div>
          </div>
          <div>
            <Label>Revizi byli přítomni</Label>
            <Input
              className="mt-1"
              value={p.revizi_pritomni ?? ""}
              onChange={e => setPinned({ revizi_pritomni: e.target.value || undefined })}
            />
          </div>
          <div>
            <Label>Metoda měření</Label>
            <Input
              className="mt-1"
              value={p.metoda_mereni ?? ""}
              onChange={e => setPinned({ metoda_mereni: e.target.value || undefined })}
            />
          </div>
          <div>
            <Label>Povětrnostní podmínky</Label>
            <Input
              className="mt-1"
              value={p.poveternostni_podminky ?? ""}
              onChange={e => setPinned({ poveternostni_podminky: e.target.value || undefined })}
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Switch
                checked={p.rozsah_vnejsi_ochrana === true}
                onCheckedChange={v => setPinned({ rozsah_vnejsi_ochrana: v ? true : undefined })}
              />
              <Label>Výchozí: vnější ochrana před bleskem (zapnuto)</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={p.rozsah_vnitrni_ochrana === true}
                onCheckedChange={v => setPinned({ rozsah_vnitrni_ochrana: v ? true : undefined })}
              />
              <Label>Výchozí: vnitřní ochrana před bleskem (zapnuto)</Label>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={upsert.isPending}>
              {upsert.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Uložit výchozí hodnoty
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDraft({})}
            >
              Vymazat vše
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
