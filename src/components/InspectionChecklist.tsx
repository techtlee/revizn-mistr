import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export interface ChecklistItem {
  id: string;
  label: string;
  reference: string;
}

export interface ChecklistGroup {
  title: string;
  items: ChecklistItem[];
}

interface InspectionChecklistProps {
  groups: ChecklistGroup[];
  values: Record<string, boolean>;
  onChange: (values: Record<string, boolean>) => void;
}

export default function InspectionChecklist({ groups, values, onChange }: InspectionChecklistProps) {
  const toggle = (id: string) => {
    onChange({ ...values, [id]: !values[id] });
  };

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.title}>
          <h4 className="text-sm font-semibold text-foreground mb-3 border-b pb-2">
            {group.title}
          </h4>
          <div className="space-y-3">
            {group.items.map((item) => {
              const checked = values[item.id] ?? false;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Switch
                    id={item.id}
                    checked={checked}
                    onCheckedChange={() => toggle(item.id)}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer leading-snug block">
                      {item.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5 break-words">
                      {item.reference}
                    </p>
                  </div>
                  <Badge
                    variant={checked ? "default" : "outline"}
                    className={checked
                      ? "bg-emerald-600 hover:bg-emerald-600 text-white border-0 shrink-0"
                      : "text-muted-foreground shrink-0"
                    }
                  >
                    {checked ? "ODPOVÍDÁ" : "—"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export const CHECKLIST_E11: ChecklistGroup[] = [
  {
    title: "E.1.1.1. Jímací soustava",
    items: [
      { id: "e111_nahodne_jimace", label: "Parametry náhodných jímačů", reference: "ČSN EN 62305–3, čl. 5.2.5, tabulky 3,6" },
      { id: "e111_zvolene_zarizeni", label: "Zvolené jímací zařízení", reference: "ČSN EN 62305–3, čl. 5.2.1" },
      { id: "e111_ochranny_uhel", label: "Ochranný úhel", reference: "ČSN EN 62305–3, čl. 5.2.2., tab.2" },
      { id: "e111_mrizova_soustava", label: "Mřížová soustava", reference: "ČSN EN 62305–3, čl. 5.2.2., tab.2" },
      { id: "e111_vzdalenost_vodicu", label: "Vzdálenost pokládaných vodičů jímací soustavy od střechy", reference: "ČSN EN 62305–3, čl. 5.2.4." },
      { id: "e111_uchyceni_vodicu", label: "Uchycení vodičů jímací soustavy a připojení k jímacím tyčím", reference: "ČSN EN 62305–3, čl. E.5.2.4, tab.E.1" },
    ],
  },
  {
    title: "E.1.1.2. Soustava svodů",
    items: [
      { id: "e112_pocet_svodu", label: "Počet svodů", reference: "ČSN EN 62305–3, čl. 5.2., tabulka 2" },
      { id: "e112_vzdalenost_svodu", label: "Vzdálenost mezi svody", reference: "ČSN EN 62305–3, čl. 5.3.3, tabulka 4" },
      { id: "e112_rovnomerne_rozmisteni", label: "Svody jsou rozmístěny rovnoměrně po obvodu objektu", reference: "ČSN EN 62305–3, čl. 5.3.3." },
      { id: "e112_izolovaný_hromosvod", label: "Počet svodů pro izolovaný hromosvod", reference: "ČSN EN 62305–3, čl. 5.3.3." },
      { id: "e112_okapy", label: "Svody nejsou uloženy v okapech", reference: "ČSN EN 62305–3, čl. 5.3.4." },
      { id: "e112_instalacni_smycka", label: "Velikost instalační smyčky", reference: "ČSN EN 62305–3, čl. 5.3.4." },
      { id: "e112_elektricka_izolace", label: "Elektrická izolace vnějšího LPS", reference: "ČSN EN 62305–3, čl. 6.3." },
      { id: "e112_materialy", label: "Použité materiály", reference: "ČSN EN 62305–3, čl. 5.6.2, tab.6" },
      { id: "e112_zkusebni_svorka", label: "Zkušební svorka (vč. označení)", reference: "ČSN EN 62305-3, čl. 5.3.6 (př. obr. E.23d)" },
    ],
  },
  {
    title: "E1.1.3. Uzemňovací soustava",
    items: [
      { id: "e113_usporadani", label: "Uspořádání zemnící soustavy je vhodné pro daný objekt", reference: "ČSN EN 62305–3, čl. 5.4.2.1" },
      { id: "e113_delka_zemnicu", label: "Délka zemničů dle třídy LPS", reference: "ČSN EN 62305–3, čl. 5.4.2.1" },
      { id: "e113_materialy", label: "Použité materiály", reference: "ČSN EN 62305–3, čl. 5.6.2, tab.7" },
      { id: "e113_pasivni_ochrana", label: "Pasivní ochrana proti korozi", reference: "ČSN 33 2000-5-54 ed.2, čl. NA.7.5" },
    ],
  },
  {
    title: "E1.1.4. Ekvipotenciální pospojování proti blesku",
    items: [
      { id: "e114_izolovaný_lps", label: "U izolovaného LPS je ekv. vyrovnání pro kovové instalace provedeno na úrovni terénu", reference: "ČSN EN 62305–3, čl. 6.2.2" },
      { id: "e114_neizolovaný_lps", label: "U neizolovaného LPS je ekv. pospojování v místech sklepů nebo na úrovni terénu a vodiče pospojování jsou připojeny k HOP", reference: "ČSN EN 62305–3, čl. 6.2.2" },
      { id: "e114_min_prurezy", label: "Min. průřezy vodičů pospojování", reference: "ČSN EN 62305–3, čl. 6.2.2, tab.8,9" },
    ],
  },
];

export const CHECKLIST_E12: ChecklistGroup[] = [
  {
    title: "E1.2.1. Uzemnění a pospojování",
    items: [
      { id: "e121_min_prurezy", label: "Min. průřezy vodičů pospojování", reference: "ČSN EN 62305–3, čl. 6.2.2, tab.8,9" },
      { id: "e121_provedeni_uzemneni", label: "Provedení uzemnění", reference: "ČSN EN 62305–4, čl. 5.1" },
      { id: "e121_impedance", label: "Je zabezpečená co nejnižší hodnota impedance pospojování", reference: "ČSN EN 62305–4, čl. 5.2" },
    ],
  },
  {
    title: "E1.2.2. Magnetické stínění a trasy vedení",
    items: [
      { id: "e122_stineni_vedeni", label: "Stínění vnějších vedení vstupujících do stavby", reference: "ČSN EN 62305–4, čl. 4.3" },
      { id: "e122_rozhrani_lpz", label: "Na rozhraní LPZ0A a LPZ1 odpovídají mat. a rozměry magnetických stínění", reference: "ČSN EN 62305-3 tab.3,6" },
    ],
  },
  {
    title: "E1.2.3. Koordinovaná SPD ochrana",
    items: [
      { id: "e123_spd_umisteni", label: "SPD jsou koordinovaně umístěny na vstupu vedení do každé zóny", reference: "ČSN EN 62305-4 tab.4.3" },
      { id: "e123_spd_revize", label: "SPD musí být instalovány tak, aby byla možná jejich revize", reference: "ČSN EN 62305–3, čl. 6.2.1" },
      { id: "e123_spd_prurezy", label: "Spojovací vodiče k SPD mají minimální průřez", reference: "ČSN EN 62305-4, tab.1e" },
    ],
  },
];
