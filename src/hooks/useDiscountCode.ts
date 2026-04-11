import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ValidatedDiscount {
  id: string;
  code: string;
  amount: number;
}

export function useDiscountCode() {
  const [discount, setDiscount] = useState<ValidatedDiscount | null>(null);
  const [validating, setValidating] = useState(false);

  const validateCode = async (code: string): Promise<ValidatedDiscount | null> => {
    if (!code.trim()) {
      toast.error("يرجى إدخال كود الخصم");
      return null;
    }

    setValidating(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("discount_codes" as any)
        .select("id, code, amount, max_uses")
        .eq("code", code.toUpperCase().trim())
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("كود الخصم غير صالح أو منتهي الصلاحية");
        setDiscount(null);
        return null;
      }

      // Check if current user already used this code
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count: userUsageCount } = await supabase
          .from("discount_code_usages")
          .select("id", { count: "exact", head: true })
          .eq("code_id", (data as any).id)
          .eq("user_id", user.id);
        if (userUsageCount && userUsageCount > 0) {
          toast.error("لقد استخدمت هذا الكود من قبل");
          setDiscount(null);
          return null;
        }
      }

      // Check max uses
      if ((data as any).max_uses) {
        const { count } = await supabase
          .from("discount_code_usages" as any)
          .select("id", { count: "exact", head: true })
          .eq("code_id", (data as any).id);
        if (count !== null && count >= (data as any).max_uses) {
          toast.error("تم استنفاد الحد الأقصى لاستخدام هذا الكود");
          setDiscount(null);
          return null;
        }
      }

      const validated: ValidatedDiscount = {
        id: (data as any).id,
        code: (data as any).code,
        amount: (data as any).amount,
      };
      setDiscount(validated);
      toast.success(`تم تطبيق كود الخصم — خصم ${validated.amount.toLocaleString()} ر.س`);
      return validated;
    } catch {
      toast.error("حدث خطأ أثناء التحقق من الكود");
      return null;
    } finally {
      setValidating(false);
    }
  };

  const recordUsage = async (params: {
    codeId: string;
    userId: string;
    discountAmount: number;
    escrowId?: string;
    projectId?: string;
    serviceId?: string;
  }) => {
    await supabase.from("discount_code_usages" as any).insert({
      code_id: params.codeId,
      user_id: params.userId,
      discount_amount: params.discountAmount,
      escrow_id: params.escrowId || null,
      project_id: params.projectId || null,
      service_id: params.serviceId || null,
    });
  };

  const clearDiscount = () => setDiscount(null);

  return { discount, validating, validateCode, recordUsage, clearDiscount };
}
