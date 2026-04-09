import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const STREETS = [
  "Na Třebešíně 12, Praha 3",
  "Korunní 88, Praha 2",
  "Vinohradská 45, Praha 10",
  "Pražská 7, Říčany",
  "Husova 234, Benešov",
  "Školní 15, Kolín",
  "Nádražní 3, Kutná Hora",
  "Komenského 22, Čáslav",
  "Mánesova 67, Praha 2",
  "Sokolská 19, Praha 2",
  "Pod Viktorkou 5, Praha 10",
  "Průběžná 33, Praha 10",
  "Moskevská 12, Praha 10",
  "Jiřího z Poděbrad 8, Praha 3",
  "Seifertova 44, Praha 3",
  "Ondříčkova 21, Praha 3",
  "Sudoměřská 56, Praha 3",
  "Lucemburská 11, Praha 3",
  "Křišťanova 9, Praha 3",
  "Rokycanova 34, Praha 3",
  "Táboritská 7, Praha 3",
  "Řehořova 4, Praha 3",
  "Cimburkova 18, Praha 3",
  "Koněvova 130, Praha 3",
  "Slavíkova 2, Praha 2",
  "Blanická 25, Praha 2",
  "Americká 42, Praha 2",
  "Londýnská 58, Praha 2",
  "Uruguayská 13, Praha 2",
  "Belgická 31, Praha 2",
];

const OBJEDNATELE = [
  "SVJ Korunní 88",
  "BD Vinohradská 45",
  "Jan Novák",
  "Marie Svobodová",
  "Petr Dvořák",
  "Karel Černý",
  "Tomáš Procházka",
  "Jiří Kučera",
  "František Veselý",
  "Martin Horák",
  "Bytové družstvo Praha 3",
  "SVJ Pod Viktorkou",
  "Městský úřad Říčany",
  "ALFA Invest s.r.o.",
  "BETA Reality a.s.",
];

const TECHNIKY = [
  "Ing. Josef Vitmajer",
  "Ing. Petr Hromádka",
];

const TYP_OBJEKTU = [
  "pro bytové účely",
  "pro administrativní účely",
  "průmyslový objekt",
  "objekt s nebezpečím požáru",
  "pro bytové účely",
  "pro bytové účely",
];

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
  "Nedostatečný průřez zemniče",
  "",
  "",
  "",
];

const WEATHER = ["slunečno", "oblačno", "polojasno", "zataženo", "déšť", "mlha", "slunečno, bezvětří"];
const MATERIAL_STRECHY = ["pálená taška", "beton. taška", "plech", "asfaltový pás", "EPDM fólie"];
const METODY = ["měření zemního odporu kompenzační metodou", "měření zemního odporu klešťovou metodou"];
const JIMACI = ["mřížová soustava", "tyčový jímač", "kombinovaná", "oddálený jímač"];

function randomDate(startYear: number, endYear: number): string {
  const y = startYear + Math.floor(Math.random() * (endYear - startYear + 1));
  const m = 1 + Math.floor(Math.random() * 12);
  const d = 1 + Math.floor(Math.random() * 28);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateReports() {
  const reports = [];
  for (let i = 1; i <= 30; i++) {
    const datumZahajeni = randomDate(2022, 2026);
    const trida = pick(TRIDY);
    const posudek = pick(POSUDKY);
    const zavady = posudek === "není v souladu"
      ? ZAVADY_POOL.filter(z => z).slice(0, 2 + Math.floor(Math.random() * 3)).join("\n")
      : Math.random() > 0.6 ? pick(ZAVADY_POOL.filter(z => z)) : "";

    reports.push({
      ev_cislo_zpravy: `${String(i).padStart(2, "0")}/${datumZahajeni.slice(2, 4)}`,
      typ_revize: pick(TYP_REVIZE),
      datum_zahajeni: datumZahajeni,
      datum_ukonceni: datumZahajeni,
      datum_vypracovani: datumZahajeni,
      revizni_technik: pick(TECHNIKY),
      adresa_technika: "Třebešínská 10, Praha 3",
      ev_cislo_osvedceni: "E1-A/0" + (1000 + Math.floor(Math.random() * 9000)),
      ev_cislo_opravneni: "MO-" + (100 + Math.floor(Math.random() * 900)) + "/26",
      nazev_adresa_objektu: STREETS[i - 1],
      objednatel_revize: pick(OBJEDNATELE),
      majitel_objektu: pick(OBJEDNATELE),
      provozovatel_objektu: pick(OBJEDNATELE),
      montazni_firma_nazev: "Hromosvody Vitmajer s.r.o.",
      montazni_firma_ico: "12345678",
      montazni_firma_ev_opravneni: "MO-007/26",
      rozsah_vnejsi_ochrana: true,
      rozsah_vnitrni_ochrana: Math.random() > 0.3,
      poveternostni_podminky: pick(WEATHER),
      typ_objektu: pick(TYP_OBJEKTU),
      trida_lps: trida,
      typ_jimaci_soustavy: [pick(JIMACI)],
      material_strechy: pick(MATERIAL_STRECHY),
      typ_zemnci_soustavy: Math.random() > 0.5 ? "A" : "B" as "A" | "B",
      druh_zeminy: ["hlína"],
      stav_zeminy: ["vlhká"],
      zony_ochrany_lpz: ["LPZ 0A", "LPZ 0B", "LPZ 1"],
      potencialove_vyrovnani: ["hlavní pospojování"],
      predmet_revize: "Vnější a vnitřní ochrana před bleskem dle ČSN EN 62305",
      rozsah_vnejsi: true,
      rozsah_vnitrni: Math.random() > 0.3,
      rozsah_uzemneni: true,
      technicky_popis: `Objekt ${STREETS[i - 1].split(",")[0]} je ${pick(TYP_OBJEKTU)} s ${pick(MATERIAL_STRECHY)} střechou. Jímací soustava je tvořena ${pick(JIMACI).toLowerCase()}. Zemnicí soustava typu ${Math.random() > 0.5 ? "A" : "B"}.`,
      metoda_mereni: pick(METODY),
      zjistene_zavady: zavady || "Bez závad",
      zaver_text: posudek === "v souladu"
        ? "LPS je v souladu s ČSN EN 62305. Doporučuji další pravidelnou revizi dle stanovených lhůt."
        : "LPS není v souladu s ČSN EN 62305. Je nutné odstranit zjištěné závady a provést následnou kontrolu.",
      stav_od_posledni_revize: pick(STAVY),
      celkovy_posudek: posudek,
      termin_lps_kriticke: trida === "I" || trida === "II" ? "2 roky" : "4 roky",
      termin_lps_ostatni: trida === "I" || trida === "II" ? "2 roky" : "4 roky",
      misto_podpisu: "Praha",
      datum_predani: datumZahajeni,
    });
  }
  return reports;
}

function generateMeasurements(reportId: string) {
  const count = 2 + Math.floor(Math.random() * 4);
  return Array.from({ length: count }, (_, i) => ({
    report_id: reportId,
    oznaceni_zkusebni_svorky: `ZS${i + 1}`,
    odpor_s_vodicem: +(0.5 + Math.random() * 15).toFixed(2),
    odpor_bez_vodice: +(0.3 + Math.random() * 12).toFixed(2),
    prechodovy_odpor: +(0.1 + Math.random() * 3).toFixed(3),
    sort_order: i,
  }));
}

function generateInstruments(reportId: string) {
  return [
    {
      report_id: reportId,
      nazev_pristroje: "METREL MI 3155",
      typ_pristroje: "Měřič zemních odporů",
      vyrobni_cislo: "SN" + (10000 + Math.floor(Math.random() * 90000)),
      cislo_kalibracniho_listu: "KL-" + (2024 + Math.floor(Math.random() * 3)) + "-" + Math.floor(Math.random() * 999),
      datum_kalibrace: randomDate(2024, 2026),
      firma_kalibrace: "ELCOM a.s.",
      sort_order: 0,
    },
  ];
}

export default function Seed() {
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(false);
  const navigate = useNavigate();

  const run = async () => {
    setRunning(true);
    setStatus("Generuji 30 revizních zpráv...");
    const reports = generateReports();
    let ok = 0;

    for (const report of reports) {
      const { data, error } = await supabase
        .from("inspection_reports")
        .insert(report as any)
        .select("id")
        .single();

      if (error) {
        setStatus(`Chyba u zprávy ${report.ev_cislo_zpravy}: ${error.message}`);
        setRunning(false);
        return;
      }

      const reportId = data.id;

      const measurements = generateMeasurements(reportId);
      await supabase.from("report_measurements").insert(measurements as any);

      const instruments = generateInstruments(reportId);
      await supabase.from("report_instruments").insert(instruments as any);

      ok++;
      setStatus(`Vloženo ${ok}/30 zpráv...`);
    }

    setStatus(`Hotovo! Vloženo ${ok} revizních zpráv s měřeními a přístroji.`);
    setRunning(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 space-y-4 text-center">
        <h1 className="text-2xl font-bold">Seed dummy data</h1>
        <p className="text-muted-foreground">
          Vloží 30 revizních zpráv s různými třídami LPS, posudky, daty a měřeními.
        </p>
        <Button onClick={run} disabled={running} className="w-full">
          {running ? "Probíhá..." : "Vložit 30 zpráv"}
        </Button>
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
        <Button variant="outline" onClick={() => navigate("/")} className="w-full">
          Zpět na dashboard
        </Button>
      </div>
    </div>
  );
}
