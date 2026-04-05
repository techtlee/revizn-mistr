import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFormSettingsQuery, useUpsertFormSettings } from "@/hooks/useFormSettings";
import { newId, type FormSettingsDocument, type PinnedDefaults } from "@/lib/formSettings";

const TYP_REVIZE = [
  { value: "výchozí", label: "Výchozí" },
  { value: "pravidelná", label: "Pravidelná" },
  { value: "mimořádná", label: "Mimořádná" },
] as const;

const TRIDA_LPS = ["I", "II", "III", "IV"] as const;

export default function FormSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading } = useFormSettingsQuery();
  const upsert = useUpsertFormSettings();
  const [draft, setDraft] = useState<FormSettingsDocument | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const save = () => {
    if (!draft) return;
    upsert.mutate(draft, {
      onSuccess: () => toast({ title: "Uloženo", description: "Nastavení formuláře bylo uloženo." }),
      onError: () =>
        toast({ title: "Chyba", description: "Nepodařilo se uložit nastavení.", variant: "destructive" }),
    });
  };

  const setPinned = (patch: Partial<PinnedDefaults>) => {
    setDraft(d => {
      if (!d) return d;
      return {
        ...d,
        pinnedDefaults: { ...d.pinnedDefaults, ...patch },
      };
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoading || draft === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const d = draft;
  const p = d.pinnedDefaults || {};

  return (
    <div className="min-h-screen bg-background">
      <div className="page-content max-w-4xl mx-auto py-8 px-4">
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zpět
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Nastavení formuláře</h1>
          <Button onClick={save} disabled={upsert.isPending} className="ml-auto">
            {upsert.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Uložit nastavení
          </Button>
        </div>

        <Tabs defaultValue="companies" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="companies">Firmy</TabsTrigger>
            <TabsTrigger value="instruments">Přístroje</TabsTrigger>
            <TabsTrigger value="templates">Technický popis</TabsTrigger>
            <TabsTrigger value="defects">Závady</TabsTrigger>
            <TabsTrigger value="pinned">Výchozí hodnoty</TabsTrigger>
          </TabsList>

          <TabsContent value="companies">
            <Card>
              <CardHeader>
                <CardTitle>Uložené montážní firmy</CardTitle>
                <CardDescription>
                  Použijí se v revizi v přehledném výběru; po výběru se doplní IČ a evidenční číslo oprávnění.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {d.savedCompanies.map((row, idx) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-2 items-end border-b border-border pb-4"
                  >
                    <div>
                      <Label className="text-xs">Název</Label>
                      <Input
                        value={row.nazev}
                        onChange={e => {
                          const next = [...d.savedCompanies];
                          next[idx] = { ...row, nazev: e.target.value };
                          setDraft({ ...d, savedCompanies: next });
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">IČ</Label>
                      <Input
                        value={row.ico}
                        onChange={e => {
                          const next = [...d.savedCompanies];
                          next[idx] = { ...row, ico: e.target.value };
                          setDraft({ ...d, savedCompanies: next });
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Ev. č. oprávnění</Label>
                      <Input
                        value={row.ev_opravneni}
                        onChange={e => {
                          const next = [...d.savedCompanies];
                          next[idx] = { ...row, ev_opravneni: e.target.value };
                          setDraft({ ...d, savedCompanies: next });
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() =>
                        setDraft({
                          ...d,
                          savedCompanies: d.savedCompanies.filter(x => x.id !== row.id),
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setDraft({
                      ...d,
                      savedCompanies: [
                        ...d.savedCompanies,
                        { id: newId(), nazev: "", ico: "", ev_opravneni: "" },
                      ],
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" /> Přidat firmu
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instruments">
            <Card>
              <CardHeader>
                <CardTitle>Šablony měřicích přístrojů</CardTitle>
                <CardDescription>Šablony pro pozdější předvyplnění v revizi (Epic 2).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {d.savedMeasuringInstruments.map((row, idx) => (
                  <div key={row.id} className="space-y-2 border-b border-border pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Název přístroje</Label>
                        <Input
                          value={row.nazev_pristroje ?? ""}
                          onChange={e => {
                            const next = [...d.savedMeasuringInstruments];
                            next[idx] = { ...row, nazev_pristroje: e.target.value || null };
                            setDraft({ ...d, savedMeasuringInstruments: next });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Typ</Label>
                        <Input
                          value={row.typ_pristroje ?? ""}
                          onChange={e => {
                            const next = [...d.savedMeasuringInstruments];
                            next[idx] = { ...row, typ_pristroje: e.target.value || null };
                            setDraft({ ...d, savedMeasuringInstruments: next });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Výrobní číslo</Label>
                        <Input
                          value={row.vyrobni_cislo ?? ""}
                          onChange={e => {
                            const next = [...d.savedMeasuringInstruments];
                            next[idx] = { ...row, vyrobni_cislo: e.target.value || null };
                            setDraft({ ...d, savedMeasuringInstruments: next });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Č. kalibračního listu</Label>
                        <Input
                          value={row.cislo_kalibracniho_listu ?? ""}
                          onChange={e => {
                            const next = [...d.savedMeasuringInstruments];
                            next[idx] = { ...row, cislo_kalibracniho_listu: e.target.value || null };
                            setDraft({ ...d, savedMeasuringInstruments: next });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Datum kalibrace</Label>
                        <Input
                          value={row.datum_kalibrace ?? ""}
                          onChange={e => {
                            const next = [...d.savedMeasuringInstruments];
                            next[idx] = { ...row, datum_kalibrace: e.target.value || null };
                            setDraft({ ...d, savedMeasuringInstruments: next });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Firma kalibrace</Label>
                        <Input
                          value={row.firma_kalibrace ?? ""}
                          onChange={e => {
                            const next = [...d.savedMeasuringInstruments];
                            next[idx] = { ...row, firma_kalibrace: e.target.value || null };
                            setDraft({ ...d, savedMeasuringInstruments: next });
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() =>
                        setDraft({
                          ...d,
                          savedMeasuringInstruments: d.savedMeasuringInstruments.filter(x => x.id !== row.id),
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Odstranit šablonu
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setDraft({
                      ...d,
                      savedMeasuringInstruments: [
                        ...d.savedMeasuringInstruments,
                        {
                          id: newId(),
                          nazev_pristroje: null,
                          typ_pristroje: null,
                          vyrobni_cislo: null,
                          cislo_kalibracniho_listu: null,
                          datum_kalibrace: null,
                          firma_kalibrace: null,
                        },
                      ],
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" /> Přidat šablonu přístroje
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Šablony technického popisu</CardTitle>
                <CardDescription>Texty pro předvyplnění pole technický popis (Epic 2).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {d.technicalDescriptionTemplates.map((row, idx) => (
                  <div key={row.id} className="space-y-2 border-b border-border pb-4">
                    <div>
                      <Label className="text-xs">Název šablony</Label>
                      <Input
                        value={row.name}
                        onChange={e => {
                          const next = [...d.technicalDescriptionTemplates];
                          next[idx] = { ...row, name: e.target.value };
                          setDraft({ ...d, technicalDescriptionTemplates: next });
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Text</Label>
                      <Textarea
                        rows={6}
                        value={row.body}
                        onChange={e => {
                          const next = [...d.technicalDescriptionTemplates];
                          next[idx] = { ...row, body: e.target.value };
                          setDraft({ ...d, technicalDescriptionTemplates: next });
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() =>
                        setDraft({
                          ...d,
                          technicalDescriptionTemplates: d.technicalDescriptionTemplates.filter(x => x.id !== row.id),
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Odstranit
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setDraft({
                      ...d,
                      technicalDescriptionTemplates: [
                        ...d.technicalDescriptionTemplates,
                        { id: newId(), name: "", body: "" },
                      ],
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" /> Přidat šablonu
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defects">
            <Card>
              <CardHeader>
                <CardTitle>Časté závady</CardTitle>
                <CardDescription>Rychlý výběr v revizi (Epic 2).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {d.commonDefects.map((row, idx) => (
                  <div key={row.id} className="flex gap-2 items-center">
                    <Input
                      className="flex-1"
                      value={row.labelCs}
                      onChange={e => {
                        const next = [...d.commonDefects];
                        next[idx] = { ...row, labelCs: e.target.value };
                        setDraft({ ...d, commonDefects: next });
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive shrink-0"
                      onClick={() =>
                        setDraft({
                          ...d,
                          commonDefects: d.commonDefects.filter(x => x.id !== row.id),
                        })
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setDraft({
                      ...d,
                      commonDefects: [...d.commonDefects, { id: newId(), labelCs: "" }],
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-2" /> Přidat závadu
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pinned">
            <Card>
              <CardHeader>
                <CardTitle>Výchozí hodnoty pro nové revize</CardTitle>
                <CardDescription>
                  Po přihlášení se při vytvoření nové zprávy předvyplní tato pole (existující zprávy se nemění).
                </CardDescription>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setDraft({
                      ...d,
                      pinnedDefaults: {},
                    })
                  }
                >
                  Vymazat všechny výchozí hodnoty
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
