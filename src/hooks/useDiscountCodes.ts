import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DiscountCode {
  id: string;
  code: string;
  amount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  max_uses: number | null;
  created_at: string;
  usage_count?: number;
}

export interface DiscountCodeUsage {
  id: string;
  code_id: string;
  user_id: string;
  escrow_id: string | null;
  project_id: string | null;
  service_id: string | null;
  discount_amount: number;
  created_at: string;
  profiles?: { full_name: string; organization_name: string | null };
  projects?: { title: string } | null;
  micro_services?: { title: string } | null;
}

export function useDiscountCodes() {
  return useQuery({
    queryKey: ["admin-discount-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_codes" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get usage counts
      const codes = (data || []) as any[];
      const codeIds = codes.map((c: any) => c.id);
      if (codeIds.length > 0) {
        const { data: usages } = await supabase
          .from("discount_code_usages" as any)
          .select("code_id");
        const counts: Record<string, number> = {};
        (usages || []).forEach((u: any) => {
          counts[u.code_id] = (counts[u.code_id] || 0) + 1;
        });
        return codes.map((c: any) => ({ ...c, usage_count: counts[c.id] || 0 })) as DiscountCode[];
      }
      return codes.map((c: any) => ({ ...c, usage_count: 0 })) as DiscountCode[];
    },
  });
}

export function useDiscountCodeUsages(codeId: string | null) {
  return useQuery({
    queryKey: ["discount-code-usages", codeId],
    enabled: !!codeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_code_usages" as any)
        .select("*, profiles:user_id(full_name, organization_name), projects(title), micro_services:service_id(title)")
        .eq("code_id", codeId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DiscountCodeUsage[];
    },
  });
}

export function useCreateDiscountCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { code: string; amount: number; start_date: string; end_date: string; max_uses?: number | null }) => {
      const { error } = await supabase
        .from("discount_codes" as any)
        .insert({
          code: input.code.toUpperCase().trim(),
          amount: input.amount,
          start_date: input.start_date,
          end_date: input.end_date,
          max_uses: input.max_uses ?? null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      toast.success("تم إنشاء كود الخصم بنجاح");
    },
    onError: (e: any) => {
      if (e?.message?.includes("duplicate")) {
        toast.error("هذا الكود مستخدم مسبقاً");
      } else {
        toast.error("حدث خطأ أثناء إنشاء الكود");
      }
    },
  });
}

export function useUpdateDiscountCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DiscountCode> & { id: string }) => {
      const { error } = await supabase
        .from("discount_codes" as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      toast.success("تم تحديث كود الخصم");
    },
    onError: () => toast.error("حدث خطأ أثناء التحديث"),
  });
}

export function useDeleteDiscountCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("discount_codes" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-discount-codes"] });
      toast.success("تم حذف كود الخصم");
    },
    onError: () => toast.error("حدث خطأ أثناء الحذف"),
  });
}
