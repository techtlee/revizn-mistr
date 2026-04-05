import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { parsePinnedDefaultsJson, type PinnedDefaults } from "@/lib/formSettings";
import type { Json } from "@/integrations/supabase/types";

export const pinnedDefaultsQueryKey = (userId: string | undefined) => ["pinnedDefaults", userId] as const;

export function usePinnedDefaultsQuery() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: pinnedDefaultsQueryKey(user?.id),
    enabled: !loading && !!user,
    queryFn: async () => {
      if (!user) return {} as PinnedDefaults;
      const { data, error } = await supabase
        .from("user_form_settings")
        .select("pinned_defaults")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return parsePinnedDefaultsJson(data?.pinned_defaults);
    },
  });
}

export function useUpsertPinnedDefaults() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (pinnedDefaults: PinnedDefaults) => {
      if (!user) throw new Error("Musíte být přihlášeni.");
      const { error } = await supabase.from("user_form_settings").upsert(
        {
          user_id: user.id,
          pinned_defaults: pinnedDefaults as unknown as Json,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pinnedDefaultsQueryKey(user?.id) });
    },
  });
}
