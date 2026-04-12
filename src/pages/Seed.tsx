import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

interface SeedAddress {
  ulice: string;
  obec: string;
  psc: string;
}

const ADDRESSES: SeedAddress[] = [
  { ulice: "Na Třebešíně 12", obec: "Praha 3", psc: "130 00" },
  { ulice: "Korunní 88", obec: "Praha 2", psc: "120 00" },
  { ulice: "Vinohradská 45", obec: "Praha 10", psc: "101 00" },
  { ulice: "Pražská 7", obec: "Říčany", psc: "251 01" },
  { ulice: "Husova 234", obec: "Benešov", psc: "256 01" },
  { ulice: "Školní 15", obec: "Kolín", psc: "280 02" },
  { ulice: "Nádražní 3", obec: "Kutná Hora", psc: "284 01" },
  { ulice: "Komenského 22", obec: "Čáslav", psc: "286 01" },
  { ulice: "Mánesova 67", obec: "Praha 2", psc: "120 00" },
  { ulice: "Sokolská 19", obec: "Praha 2", psc: "120 00" },
  { ulice: "Pod Viktorkou 5", obec: "Praha 10", psc: "101 00" },
  { ulice: "Průběžná 33", obec: "Praha 10", psc: "100 00" },
  { ulice: "Moskevská 12", obec: "Praha 10", psc: "101 00" },
  { ulice: "Jiřího z Poděbrad 8", obec: "Praha 3", psc: "130 00" },
  { ulice: "Seifertova 44", obec: "Praha 3", psc: "130 00" },
  { ulice: "Ondříčkova 21", obec: "Praha 3", psc: "130 00" },
  { ulice: "Sudoměřská 56", obec: "Praha 3", psc: "130 00" },
  { ulice: "Lucemburská 11", obec: "Praha 3", psc: "130 00" },
  { ulice: "Křišťanova 9", obec: "Praha 3", psc: "130 00" },
  { ulice: "Rokycanova 34", obec: "Praha 3", psc: "130 00" },
];

interface SeedClient {
  name: string;
  ico: string;
  email: string;
  phone: string;
  contact_person: string;
  address_street: string;
  address_city: string;
  address_zip: string;
  client_type: string[];
  notes: string;
}

const CLIENTS: SeedClient[] = [
  { name: "SVJ Korunní 88", ico: "27512345", email: "svj@korunni88.cz", phone: "+420 777 111 222", contact_person: "Ing. Pavel Novotný", address_street: "Korunní 88", address_city: "Praha 2", address_zip: "120 00", client_type: ["objednatel", "majitel"], notes: "Pravidelný zákazník od 2020" },
  { name: "BD Vinohradská 45", ico: "28765432", email: "bd.vinohradska@email.cz", phone: "+420 602 333 444", contact_person: "Marie Dvořáková", address_street: "Vinohradská 45", address_city: "Praha 10", address_zip: "101 00", client_type: ["objednatel"], notes: "" },
  { name: "Jan Novák", ico: "87654321", email: "novak@firma.cz", phone: "+420 608 555 666", contact_person: "", address_street: "Pražská 7", address_city: "Říčany", address_zip: "251 01", client_type: ["objednatel", "majitel", "provozovatel"], notes: "Rodinný dům" },
  { name: "ALFA Invest s.r.o.", ico: "45678901", email: "info@alfainvest.cz", phone: "+420 222 999 888", contact_person: "Mgr. Tomáš Kučera", address_street: "Národní 15", address_city: "Praha 1", address_zip: "110 00", client_type: ["majitel"], notes: "Správa komerčních budov v centru Prahy" },
  { name: "Městský úřad Říčany", ico: "00240800", email: "podatelna@ricany.cz", phone: "+420 323 618 111", contact_person: "Ing. Jiřina Pokorná", address_street: "Masarykovo nám. 53", address_city: "Říčany", address_zip: "251 01", client_type: ["objednatel", "provozovatel"], notes: "Městské objekty - školy, úřad, kulturní dům" },
  { name: "Petr Dvořák", ico: "", email: "petr.dvorak@seznam.cz", phone: "+420 775 123 456", contact_person: "", address_street: "Husova 234", address_city: "Benešov", address_zip: "256 01", client_type: ["objednatel", "majitel"], notes: "" },
  { name: "BETA Reality a.s.", ico: "67890123", email: "reality@beta.cz", phone: "+420 251 777 000", contact_person: "Karel Černý", address_street: "Vinohradská 120", address_city: "Praha 3", address_zip: "130 00", client_type: ["majitel"], notes: "Několik bytových domů na Žižkově" },
  { name: "SVJ Pod Viktorkou", ico: "26543210", email: "svj.viktorka@gmail.com", phone: "+420 604 987 654", contact_person: "Alena Horáková", address_street: "Pod Viktorkou 5", address_city: "Praha 10", address_zip: "101 00", client_type: ["objednatel"], notes: "Kontaktovat vždy e-mailem" },
];

const TECHNIKY = ["Ing. Jan Novák", "Ing. Petr Hromádka"];
const TYP_OBJEKTU = ["pro bytové účely", "pro administrativní účely", "průmyslový objekt", "objekt s nebezpečím požáru", "pro bytové účely", "pro bytové účely"];
const TRIDY: ("I" | "II" | "III" | "IV")[] = ["I", "II", "III", "IV", "III", "III", "IV", "II"];
const TYP_REVIZE: ("výchozí" | "pravidelná" | "mimořádná")[] = ["pravidelná", "pravidelná", "pravidelná", "výchozí", "mimořádná", "pravidelná"];
const POSUDKY: ("v souladu" | "není v souladu")[] = ["v souladu", "v souladu", "v souladu", "v souladu", "není v souladu", "v souladu", "v souladu"];
const STAVY: ("stejný" | "zhoršil se")[] = ["stejný", "stejný", "stejný", "zhoršil se", "stejný"];
const ZAVADY_POOL = [
  "Koroze svodu č. 3 u vstupu do země",
  "Chybí zkušební svorka u svodu č. 2",
  "Uvolněná svorka na hřebeni střechy",
  "Přechodový odpor svodu č. 1 překračuje normu",
  "Poškozená izolace vodiče u komína",
  "Chybějící ochrana SPD v rozváděči RH",
];
const WEATHER = ["slunečno", "oblačno", "polojasno", "zataženo", "slunečno, bezvětří"];
const MATERIAL_STRECHY = ["pálená taška", "beton. taška", "plech", "asfaltový pás", "EPDM fólie"];
const METODY = ["měření zemního odporu kompenzační metodou", "měření zemního odporu klešťovou metodou"];
const JIMACI = ["mřížová soustava", "tyčový jímač", "kombinovaná", "oddálený jímač"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Dates spread strategically: some old (overdue deadlines), some recent, some very recent
const DATE_RANGES = [
  // 6 reports from 2022 -> deadlines passed or imminent for class III/IV (4yr)
  ...Array.from({ length: 6 }, () => ({ year: 2022, month: 1 + Math.floor(Math.random() * 12) })),
  // 5 reports from early 2024 -> deadlines soon for class I/II (2yr)
  ...Array.from({ length: 5 }, () => ({ year: 2024, month: 1 + Math.floor(Math.random() * 6) })),
  // 8 reports from 2024-2025 -> comfortable timeline
  ...Array.from({ length: 8 }, () => ({ year: 2024 + Math.floor(Math.random() * 2), month: 1 + Math.floor(Math.random() * 12) })),
  // 8 reports from 2025-2026 -> recent
  ...Array.from({ length: 8 }, () => ({ year: 2025 + Math.floor(Math.random() * 2), month: 1 + Math.floor(Math.random() * (new Date().getMonth() + 1)) })),
  // 3 extra for drafts
  ...Array.from({ length: 3 }, () => ({ year: 2026, month: 4 })),
];

export default function Seed() {
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const run = async () => {
    if (!user) {
      setStatus("Musíte být přihlášeni.");
      return;
    }
    setRunning(true);

    try {
      // 1. Create or reuse clients (deduplicate by ico + name)
      setStatus("Vytvářím klienty...");
      const clientIds: string[] = [];
      for (const c of CLIENTS) {
        let existing: { id: string } | null = null;
        if (c.ico) {
          const { data } = await supabase
            .from("clients")
            .select("id")
            .eq("ico", c.ico)
            .eq("name", c.name)
            .maybeSingle();
          existing = data;
        }
        if (existing) {
          clientIds.push(existing.id);
        } else {
          const { data: inserted, error } = await supabase
            .from("clients")
            .insert({ ...c, created_by: user.id })
            .select("id")
            .single();
          if (error) throw new Error(`Klient ${c.name}: ${error.message}`);
          clientIds.push(inserted!.id);
        }
      }
      setStatus(`Připraveno ${clientIds.length} klientů.`);

      // 2. Create 27 complete reports + 3 drafts = 30 total
      let reportOk = 0;
      for (let i = 0; i < 30; i++) {
        const addr = ADDRESSES[i % ADDRESSES.length];
        const dateInfo = DATE_RANGES[i];
        const day = 1 + Math.floor(Math.random() * 28);
        const datumZahajeni = `${dateInfo.year}-${String(dateInfo.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const trida = i < 6 ? pick(["I", "II"] as const) : pick(TRIDY);
        const isDraft = i >= 27;
        const posudek = isDraft ? null : pick(POSUDKY);
        const zavady = posudek === "není v souladu"
          ? ZAVADY_POOL.slice(0, 2 + Math.floor(Math.random() * 3)).join("\n")
          : posudek === "v souladu"
          ? (Math.random() > 0.7 ? pick(ZAVADY_POOL) : "Bez závad")
          : "";

        const report: Record<string, unknown> = {
          ev_cislo_zpravy: isDraft ? null : `${String(i + 1).padStart(2, "0")}/${String(dateInfo.year).slice(2)}`,
          typ_revize: pick(TYP_REVIZE),
          datum_zahajeni: isDraft ? null : datumZahajeni,
          datum_ukonceni: isDraft ? null : datumZahajeni,
          datum_vypracovani: isDraft ? null : datumZahajeni,
          revizni_technik: pick(TECHNIKY),
          adresa_technika: "Třebešínská 10, Praha 3",
          ev_cislo_osvedceni: "E1-A/0" + (1000 + Math.floor(Math.random() * 9000)),
          ev_cislo_opravneni: "MO-" + (100 + Math.floor(Math.random() * 900)) + "/26",
          adresa_ulice: addr.ulice,
          adresa_obec: addr.obec,
          adresa_psc: addr.psc,
          objednatel_revize: CLIENTS[i % CLIENTS.length].name,
          majitel_objektu: CLIENTS[(i + 2) % CLIENTS.length].name,
          provozovatel_objektu: CLIENTS[(i + 4) % CLIENTS.length].name,
          montazni_firma_nazev: "Revizní mistr s.r.o.",
          montazni_firma_ico: "12345678",
          montazni_firma_ev_opravneni: "MO-007/26",
          rozsah_vnejsi_ochrana: true,
          rozsah_vnitrni_ochrana: Math.random() > 0.3,
          poveternostni_podminky: pick(WEATHER),
          typ_objektu: pick(TYP_OBJEKTU),
          trida_lps: trida,
          typ_jimaci_soustavy: [pick(JIMACI)],
          material_strechy: pick(MATERIAL_STRECHY),
          typ_zemnci_soustavy: Math.random() > 0.5 ? "A" : "B",
          druh_zeminy: ["hlína"],
          stav_zeminy: ["vlhká"],
          zony_ochrany_lpz: ["LPZ 0A", "LPZ 0B", "LPZ 1"],
          potencialove_vyrovnani: ["hlavní pospojování"],
          predmet_revize: isDraft ? null : "Vnější a vnitřní ochrana před bleskem dle ČSN EN 62305",
          rozsah_vnejsi: true,
          rozsah_vnitrni: Math.random() > 0.3,
          rozsah_uzemneni: true,
          technicky_popis: isDraft ? null : `Objekt ${addr.ulice} je ${pick(TYP_OBJEKTU)} s ${pick(MATERIAL_STRECHY)} střechou. Jímací soustava je tvořena ${pick(JIMACI).toLowerCase()}.`,
          metoda_mereni: pick(METODY),
          zjistene_zavady: isDraft ? null : (zavady || "Bez závad"),
          zaver_text: isDraft ? null : (posudek === "v souladu"
            ? "LPS je v souladu s ČSN EN 62305. Doporučuji další pravidelnou revizi dle stanovených lhůt."
            : "LPS není v souladu s ČSN EN 62305. Je nutné odstranit zjištěné závady."),
          stav_od_posledni_revize: isDraft ? null : pick(STAVY),
          celkovy_posudek: posudek,
          termin_lps_kriticke: (trida === "I" || trida === "II") ? "2 roky" : "4 roky",
          misto_podpisu: isDraft ? null : "Praha",
          datum_predani: isDraft ? null : datumZahajeni,
          status: isDraft ? "draft" : "complete",
          draft_step: isDraft ? Math.floor(Math.random() * 6) : null,
          created_by: user.id,
          client_id: clientIds[i % clientIds.length],
        };

        const { data: rData, error: rErr } = await supabase
          .from("inspection_reports")
          .insert(report)
          .select("id")
          .single();

        if (rErr) throw new Error(`Zpráva ${i + 1}: ${rErr.message}`);
        const reportId = rData.id;

        if (!isDraft) {
          // Measurements
          const measCount = 2 + Math.floor(Math.random() * 4);
          const measurements = Array.from({ length: measCount }, (_, j) => ({
            report_id: reportId,
            oznaceni_zkusebni_svorky: `ZS${j + 1}`,
            odpor_s_vodicem: +(0.5 + Math.random() * 15).toFixed(2),
            odpor_bez_vodice: +(0.3 + Math.random() * 12).toFixed(2),
            prechodovy_odpor: +(0.1 + Math.random() * 3).toFixed(3),
            sort_order: j,
          }));
          await supabase.from("report_measurements").insert(measurements);

          // Instruments
          await supabase.from("report_instruments").insert([{
            report_id: reportId,
            nazev_pristroje: "METREL MI 3155",
            typ_pristroje: "Měřič zemních odporů",
            vyrobni_cislo: "SN" + (10000 + Math.floor(Math.random() * 90000)),
            cislo_kalibracniho_listu: "KL-" + (2024 + Math.floor(Math.random() * 3)) + "-" + Math.floor(Math.random() * 999),
            datum_kalibrace: `${2024 + Math.floor(Math.random() * 3)}-06-15`,
            firma_kalibrace: "ELCOM a.s.",
            sort_order: 0,
          }]);

          // SPD devices for some reports
          if (Math.random() > 0.4) {
            await supabase.from("report_spd_devices").insert([{
              report_id: reportId,
              vyrobce: pick(["DEHN", "OBO Bettermann", "SALTEK", "Citel"]),
              typove_oznaceni: pick(["DEHNguard M", "V20-C", "SLP-275", "DS 50 VG"]),
              misto_instalace: pick(["Hlavní rozváděč RH", "Podružný rozváděč R1", "Rozváděč RE"]),
              sort_order: 0,
            }]);
          }
        }

        reportOk++;
        setStatus(`Vloženo ${reportOk}/30 zpráv (${isDraft ? "koncept" : "dokončená"})...`);
      }

      queryClient.invalidateQueries();
      setStatus(`Hotovo! Vytvořeno: ${clientIds.length} klientů, 27 dokončených zpráv, 3 koncepty, měření a přístroje.`);
    } catch (err) {
      setStatus(`Chyba: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunning(false);
    }
  };

  const clearAll = async () => {
    if (!await confirm({ title: "Smazat všechna data", description: "Opravdu chcete smazat VŠECHNA data (zprávy, klienty, měření, přístroje)? Tuto akci nelze vrátit zpět.", confirmLabel: "Smazat vše", variant: "destructive" })) return;
    setRunning(true);
    setStatus("Mažu všechna data...");
    try {
      await supabase.from("report_measurements").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("report_instruments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("report_spd_devices").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("inspection_reports").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("clients").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      queryClient.invalidateQueries();
      setStatus("Všechna data smazána.");
    } catch (err) {
      setStatus(`Chyba: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 text-center">
      <h1 className="text-2xl font-bold">Seed dummy data</h1>
      <p className="text-muted-foreground">
        Vloží 8 klientů, 27 dokončených revizních zpráv a 3 koncepty s měřeními, přístroji a SPD.
        Data pokrývají roky 2022–2026 pro testování termínů, kalendáře a dashboardu.
      </p>
      <div className="space-y-3">
        <Button onClick={run} disabled={running} className="w-full">
          {running ? "Probíhá..." : "Vložit testovací data"}
        </Button>
        <Button onClick={clearAll} disabled={running} variant="destructive" className="w-full">
          Smazat všechna data
        </Button>
      </div>
      {status && (
        <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">{status}</p>
      )}
      <Button variant="outline" onClick={() => navigate("/")} className="w-full">
        Zpět na dashboard
      </Button>
      <ConfirmDialog />
    </div>
  );
}
