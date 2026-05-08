import { useProfile, useBankDetails } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

interface FieldDef {
 key: string;
 label: string;
 source: "profile" | "bank" | "portfolio";
}

const commonFields: FieldDef[] = [
 { key: "full_name", label: "الاسم الكامل", source: "profile" },
 { key: "phone", label: "رقم الهاتف", source: "profile" },
];

const bankFields: FieldDef[] = [
 { key: "bank_name", label: "اسم البنك", source: "bank" },
 { key: "bank_account_number", label: "رقم الحساب البنكي", source: "bank" },
 { key: "bank_iban", label: "رقم IBAN", source: "bank" },
 { key: "bank_account_holder", label: "اسم صاحب الحساب", source: "bank" },
];

const roleFields: Record<string, FieldDef[]> = {
 youth_association: [
 { key: "organization_name", label: "اسم المنظمة", source: "profile" },
 { key: "license_number", label: "رقم الترخيص", source: "profile" },
 { key: "contact_officer_name", label: "اسم ضابط الاتصال", source: "profile" },
 { key: "contact_officer_phone", label: "رقم ضابط الاتصال", source: "profile" },
 ...bankFields,
 ],
 service_provider: [
 { key: "bio", label: "النبذة التعريفية", source: "profile" },
 ...bankFields,
 { key: "portfolio_count", label: "نموذج عمل واحد على الأقل", source: "portfolio" },
 ],
 donor: [],
 super_admin: [],
};

function usePortfolioCount() {
 const { user, role } = useAuth();
 return useQuery({
 queryKey: ["portfolio-count", user?.id],
 enabled: !!user && role === "service_provider",
 queryFn: async () => {
 const { count, error } = await supabase
 .from("portfolio_items")
 .select("id", { count: "exact", head: true })
 .eq("provider_id", user!.id)
 .is("deleted_at", null);
 if (error) throw error;
 return count ?? 0;
 },
 });
}

export function useProfileCompleteness() {
 const { role } = useAuth();
 const { data: profile, isLoading: profileLoading } = useProfile();
 const { data: bankDetails, isLoading: bankLoading } = useBankDetails();
 const { data: portfolioCount, isLoading: portfolioLoading } = usePortfolioCount();

 const isLoading = profileLoading || bankLoading || (role === "service_provider" && portfolioLoading);

 return useMemo(() => {
 if (isLoading || !profile || !role) {
 return { isComplete: true, missingFields: [] as string[], completionPercentage: 100, requiredFields: [] as FieldDef[], isLoading };
 }

 const required = [...commonFields, ...(roleFields[role] ?? [])];
 const missing: string[] = [];

 for (const f of required) {
 let val: unknown;
 if (f.source === "bank") {
 val = (bankDetails ?? {} as Record<string, unknown>)[f.key];
 } else if (f.source === "portfolio") {
 val = (portfolioCount ?? 0) > 0 ? 1 : 0;
 } else {
 val = (profile as Record<string, unknown>)[f.key];
 }
 if (val === null || val === undefined || val === "" || val === 0) {
 missing.push(f.label);
 }
 }

 const total = required.length;
 const filled = total - missing.length;
 const pct = total > 0 ? Math.round((filled / total) * 100) : 100;

 return {
 isComplete: missing.length === 0,
 missingFields: missing,
 completionPercentage: pct,
 requiredFields: required,
 isLoading,
 };
 }, [profile, bankDetails, portfolioCount, role, isLoading]);
}
