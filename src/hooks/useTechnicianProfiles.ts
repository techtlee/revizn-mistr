import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type TechnicianProfile = Tables<"technician_profiles">;
type TechnicianProfileInsert = TablesInsert<"technician_profiles">;
type TechnicianProfileUpdate = TablesUpdate<"technician_profiles">;

const queryKey = (userId: string | undefined) =>
  ["technician_profiles", userId] as const;

export function useTechnicianProfilesQuery() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: queryKey(user?.id),
    enabled: !loading && !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("technician_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as TechnicianProfile[];
    },
  });
}

export function useDefaultTechnicianProfile() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: [...queryKey(user?.id), "default"],
    enabled: !loading && !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("technician_profiles")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .maybeSingle();
      if (error) throw error;
      return data as TechnicianProfile | null;
    },
  });
}

export function useUpsertTechnicianProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (
      profile: Omit<TechnicianProfileInsert, "user_id"> & { id?: string },
    ) => {
      if (!user) throw new Error("Musíte být přihlášeni.");

      if (profile.is_default) {
        await supabase
          .from("technician_profiles")
          .update({ is_default: false } as TechnicianProfileUpdate)
          .eq("user_id", user.id)
          .eq("is_default", true);
      }

      if (profile.id) {
        const { error } = await supabase
          .from("technician_profiles")
          .update({
            name: profile.name,
            address: profile.address,
            certificate_number: profile.certificate_number,
            authorization_number: profile.authorization_number,
            signature_data: profile.signature_data,
            stamp_url: profile.stamp_url,
            phone: profile.phone,
            email: profile.email,
            is_default: profile.is_default,
          } as TechnicianProfileUpdate)
          .eq("id", profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("technician_profiles")
          .insert({ ...profile, user_id: user.id } as TechnicianProfileInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(user?.id) });
    },
  });
}

export function useDeleteTechnicianProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Musíte být přihlášeni.");
      const { error } = await supabase
        .from("technician_profiles")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(user?.id) });
    },
  });
}
