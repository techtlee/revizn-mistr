import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useDraftsQuery() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["drafts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspection_reports")
        .select("id, ev_cislo_zpravy, adresa_ulice, adresa_obec, adresa_psc, adresa_doplnek, objednatel_revize, draft_step, updated_at, created_at")
        .eq("status", "draft")
        .eq("created_by", user!.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useDraftCount() {
  const { data } = useDraftsQuery();
  return data?.length ?? 0;
}

export function useDeleteDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inspection_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drafts"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
