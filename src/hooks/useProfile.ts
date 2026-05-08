import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useBankDetails() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bank-details", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_details")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// Fields that require admin approval before being applied to the profile
export const SENSITIVE_PROFILE_FIELDS = [
  "full_name",
  "organization_name",
  "license_number",
  "contact_officer_name",
  "contact_officer_email",
  "contact_officer_phone",
  "contact_officer_title",
  "region_id",
  "city_id",
  "bio",
] as const;

export function usePendingProfileEditRequest() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pending-edit-request", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("edit_requests")
        .select("*")
        .eq("target_user_id", user!.id)
        .eq("target_table", "profiles")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (updates: Record<string, unknown>): Promise<{ hasPendingReview: boolean }> => {
      const userId = user!.id;

      // Load current profile to compute old values
      const { data: current, error: curErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (curErr) throw curErr;

      const sensitive: Record<string, unknown> = {};
      const instant: Record<string, unknown> = {};
      const oldValues: Record<string, unknown> = {};

      for (const [k, v] of Object.entries(updates)) {
        if ((SENSITIVE_PROFILE_FIELDS as readonly string[]).includes(k)) {
          const oldVal = (current as any)?.[k] ?? null;
          // Only treat as a change if value actually differs
          if ((oldVal ?? "") !== (v ?? "")) {
            sensitive[k] = v;
            oldValues[k] = oldVal;
          }
        } else {
          instant[k] = v;
        }
      }

      if (Object.keys(instant).length > 0) {
        const { error } = await supabase.from("profiles").update(instant as any).eq("id", userId);
        if (error) throw error;
      }

      let hasPendingReview = false;
      if (Object.keys(sensitive).length > 0) {
        // Merge with any existing pending request
        const { data: existing } = await supabase
          .from("edit_requests")
          .select("*")
          .eq("target_user_id", userId)
          .eq("target_table", "profiles")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          const mergedChanges = { ...(existing.requested_changes as any), ...sensitive };
          const mergedOld = { ...(existing.old_values as any), ...oldValues };
          const { error } = await supabase
            .from("edit_requests")
            .update({
              requested_changes: mergedChanges,
              old_values: mergedOld,
              updated_at: new Date().toISOString(),
            } as any)
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("edit_requests").insert({
            target_table: "profiles",
            target_id: userId,
            target_user_id: userId,
            requested_by: userId,
            requested_changes: sensitive,
            old_values: oldValues,
            status: "pending",
          } as any);
          if (error) throw error;
        }
        hasPendingReview = true;
      }

      return { hasPendingReview };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["pending-edit-request"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-users-count"] });
      qc.invalidateQueries({ queryKey: ["admin-user-by-id"] });
      qc.invalidateQueries({ queryKey: ["public-profile"] });
      qc.invalidateQueries({ queryKey: ["admin-edit-requests"] });
    },
  });
}

export function useUpdateBankDetails() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (updates: { bank_name: string; bank_account_number: string; bank_iban: string; bank_account_holder: string }) => {
      const userId = user!.id;
      // Upsert: insert if not exists, update if exists
      const { error } = await supabase
        .from("bank_details")
        .upsert(
          { user_id: userId, ...updates } as any,
          { onConflict: "user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank-details"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
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
