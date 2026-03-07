import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ESSENTIAL_FIELDS = [
  "full_name", "phone", "organization_name", "license_number", "bio",
  "contact_officer_name", "contact_officer_phone", "contact_officer_email", "contact_officer_title",
  "hourly_rate", "skills", "qualifications",
  "bank_name", "bank_account_number", "bank_iban", "bank_account_holder",
  "region_id", "city_id",
];

function hasEssentialChanges(updates: Record<string, unknown>, current: Record<string, unknown>): boolean {
  for (const key of ESSENTIAL_FIELDS) {
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

      if (currentProfile && currentProfile.is_verified && hasEssentialChanges(updates, currentProfile as any)) {
        finalUpdates.is_verified = false;
        wasVerified = true;
      }

      const { error } = await supabase
        .from("profiles")
        .update(finalUpdates as any)
        .eq("id", userId);
      if (error) throw error;

      // Notify admins if verification was revoked
      if (wasVerified) {
        const displayName = (currentProfile as any)?.organization_name || (currentProfile as any)?.full_name || "مستخدم";
        const { data: admins } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "super_admin");

        if (admins && admins.length > 0) {
          const notifications = admins.map((a) => ({
            user_id: a.user_id,
            message: `قام ${displayName} بتعديل ملفه الشخصي ويحتاج مراجعة وإعادة توثيق`,
            type: "profile_updated",
            entity_id: userId,
            entity_type: "profile",
          }));
          await supabase.from("notifications").insert(notifications);
        }
      }

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
