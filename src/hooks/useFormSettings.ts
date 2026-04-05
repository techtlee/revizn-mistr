import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  emptyFormSettingsDocument,
  parseFormSettingsJson,
  type FormSettingsDocument,
} from "@/lib/formSettings";
import type { Json } from "@/integrations/supabase/types";

export const formSettingsQueryKey = (userId: string | undefined) => ["formSettings", userId] as const;

export function useFormSettingsQuery() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: formSettingsQueryKey(user?.id),
    enabled: !loading && !!user,
    queryFn: async () => {
      if (!user) return emptyFormSettingsDocument();
      const { data, error } = await supabase
        .from("user_form_settings")
        .select("settings")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return parseFormSettingsJson(data?.settings);
    },
  });
}

export function useUpsertFormSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: FormSettingsDocument) => {
      if (!user) throw new Error("Musíte být přihlášeni.");
      const { error } = await supabase.from("user_form_settings").upsert(
        {
          user_id: user.id,
          settings: settings as unknown as Json,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formSettingsQueryKey(user?.id) });
    },
  });
}
