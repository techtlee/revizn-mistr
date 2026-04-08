import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export const libraryKeys = {
  companies: ["library", "saved_companies"] as const,
  instruments: ["library", "saved_instrument_templates"] as const,
  techTemplates: ["library", "technical_description_templates"] as const,
  defects: ["library", "common_defects"] as const,
};

type CompanyRow = Tables<"saved_companies">;
type InstrumentRow = Tables<"saved_instrument_templates">;
type TechRow = Tables<"technical_description_templates">;
type DefectRow = Tables<"common_defects">;

function authEnabled(user: boolean, loading: boolean) {
  return !loading && user;
}

export function useSavedCompaniesQuery() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: libraryKeys.companies,
    enabled: authEnabled(!!user, loading),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_companies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CompanyRow[];
    },
  });
}

export function useSavedInstrumentsQuery() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: libraryKeys.instruments,
    enabled: authEnabled(!!user, loading),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_instrument_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as InstrumentRow[];
    },
  });
}

export function useTechTemplatesQuery() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: libraryKeys.techTemplates,
    enabled: authEnabled(!!user, loading),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technical_description_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TechRow[];
    },
  });
}

export function useCommonDefectsQuery() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: libraryKeys.defects,
    enabled: authEnabled(!!user, loading),
    queryFn: async () => {
      const { data, error } = await supabase.from("common_defects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DefectRow[];
    },
  });
}

function creatorMeta(user: User) {
  return {
    created_by: user.id,
    creator_display: user.email ?? user.id,
  };
}

export function useUpsertCompany() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: { id?: string; nazev: string; ico: string; ev_opravneni: string }) => {
      if (!user) throw new Error("Musíte být přihlášeni.");
      const meta = creatorMeta(user);
      if (payload.id) {
        const row: TablesUpdate<"saved_companies"> = {
          nazev: payload.nazev,
          ico: payload.ico,
          ev_opravneni: payload.ev_opravneni,
        };
        const { error } = await supabase.from("saved_companies").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const row: TablesInsert<"saved_companies"> = {
          nazev: payload.nazev,
          ico: payload.ico,
          ev_opravneni: payload.ev_opravneni,
          ...meta,
        };
        const { error } = await supabase.from("saved_companies").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: libraryKeys.companies });
    },
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.companies }),
  });
}

export function useUpsertInstrumentTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: {
      id?: string;
      nazev_pristroje: string | null;
      typ_pristroje: string | null;
      vyrobni_cislo: string | null;
      cislo_kalibracniho_listu: string | null;
      datum_kalibrace: string | null;
      firma_kalibrace: string | null;
    }) => {
      if (!user) throw new Error("Musíte být přihlášeni.");
      const meta = creatorMeta(user);
      if (payload.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase.from("saved_instrument_templates").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { id: _id, ...rest } = payload;
        const { error } = await supabase.from("saved_instrument_templates").insert({ ...rest, ...meta });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.instruments }),
  });
}

export function useDeleteInstrumentTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_instrument_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.instruments }),
  });
}

export function useUpsertTechTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: { id?: string; name: string; body: string }) => {
      if (!user) throw new Error("Musíte být přihlášeni.");
      const meta = creatorMeta(user);
      if (payload.id) {
        const { error } = await supabase
          .from("technical_description_templates")
          .update({ name: payload.name, body: payload.body })
          .eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("technical_description_templates")
          .insert({ name: payload.name, body: payload.body, ...meta });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.techTemplates }),
  });
}

export function useDeleteTechTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("technical_description_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.techTemplates }),
  });
}

export function useUpsertCommonDefect() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: { id?: string; label_cs: string }) => {
      if (!user) throw new Error("Musíte být přihlášeni.");
      const meta = creatorMeta(user);
      if (payload.id) {
        const { error } = await supabase.from("common_defects").update({ label_cs: payload.label_cs }).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("common_defects").insert({ label_cs: payload.label_cs, ...meta });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.defects }),
  });
}

export function useDeleteCommonDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("common_defects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: libraryKeys.defects }),
  });
}
