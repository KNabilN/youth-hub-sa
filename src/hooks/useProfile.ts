import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const FINANCIAL_FIELDS = [
  "bank_name", "bank_account_number", "bank_iban", "bank_account_holder",
];

function hasFinancialChanges(updates: Record<string, unknown>, current: Record<string, unknown>): boolean {
  for (const key of FINANCIAL_FIELDS) {
    if (!(key in updates)) continue;
    const newVal = JSON.stringify(updates[key] ?? null);
    const oldVal = JSON.stringify(current[key] ?? null);
    if (newVal !== oldVal) return true;
  }
  return false;
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const userId = user!.id;

      // Get current profile to compare
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      let wasVerified = false;
      let finalUpdates = { ...updates };

      if (currentProfile && currentProfile.is_verified && hasFinancialChanges(updates, currentProfile as any)) {
        finalUpdates.is_verified = false;
        wasVerified = true;
      }

      const { error } = await supabase
        .from("profiles")
        .update(finalUpdates as any)
        .eq("id", userId);
      if (error) throw error;

      // Admin notification for financial changes is handled by database trigger
      return { wasVerified };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 2 * 1024 * 1024) throw new Error("الحد الأقصى لحجم الصورة 2 ميجابايت");
      const userId = user!.id;
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error } = await supabase.from("profiles").update({ avatar_url }).eq("id", userId);
      if (error) throw error;
      return avatar_url;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}
