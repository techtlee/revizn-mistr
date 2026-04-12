import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useReportsQuery() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspection_reports")
        .select("id, ev_cislo_zpravy, objednatel_revize, adresa_ulice, adresa_obec, adresa_psc, adresa_doplnek, datum_zahajeni, celkovy_posudek, revizni_technik, typ_revize, trida_lps, created_at")
        .or("status.eq.complete,status.is.null")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export type ReportRow = NonNullable<ReturnType<typeof useReportsQuery>["data"]>[number];
