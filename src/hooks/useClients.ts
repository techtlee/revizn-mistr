import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Client = Tables<"clients">;

export function useClientsQuery() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useClientQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["clients", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useClientReports(clientId: string | undefined) {
  return useQuery({
    queryKey: ["client-reports", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspection_reports")
        .select("id, ev_cislo_zpravy, adresa_ulice, adresa_obec, adresa_psc, adresa_doplnek, datum_zahajeni, celkovy_posudek, typ_revize, trida_lps, created_at")
        .eq("client_id", clientId!)
        .or("status.eq.complete,status.is.null")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export async function findDuplicateClient(
  ico: string | null | undefined,
  name: string,
  excludeId?: string,
): Promise<Client | null> {
  if (ico && ico.trim()) {
    const q = supabase
      .from("clients")
      .select("*")
      .eq("ico", ico.trim())
      .limit(1);
    if (excludeId) q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (data) return data;
  }
  const q2 = supabase
    .from("clients")
    .select("*")
    .ilike("name", name.trim())
    .limit(1);
  if (excludeId) q2.neq("id", excludeId);
  const { data: byName } = await q2.maybeSingle();
  return byName ?? null;
}

export function useUpsertClient() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (client: TablesInsert<"clients"> | (TablesUpdate<"clients"> & { id: string })) => {
      const isUpdate = "id" in client && client.id;
      if (isUpdate) {
        const { error } = await supabase.from("clients").update(client).eq("id", client.id!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert({
          ...client,
          created_by: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
