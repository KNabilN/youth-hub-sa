import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";

interface FieldDef {
  key: string;
  label: string;
}

const commonFields: FieldDef[] = [
  { key: "full_name", label: "الاسم الكامل" },
  { key: "phone", label: "رقم الهاتف" },
];

const bankFields: FieldDef[] = [
  { key: "bank_name", label: "اسم البنك" },
  { key: "bank_account_number", label: "رقم الحساب البنكي" },
  { key: "bank_iban", label: "رقم IBAN" },
  { key: "bank_account_holder", label: "اسم صاحب الحساب" },
];

const roleFields: Record<string, FieldDef[]> = {
  youth_association: [
    { key: "organization_name", label: "اسم المنظمة" },
    { key: "license_number", label: "رقم الترخيص" },
    { key: "contact_officer_name", label: "اسم ضابط الاتصال" },
    { key: "contact_officer_phone", label: "رقم ضابط الاتصال" },
    ...bankFields,
  ],
  service_provider: [
    { key: "bio", label: "النبذة التعريفية" },
    ...bankFields,
  ],
  donor: [],
  super_admin: [],
};

export function useProfileCompleteness() {
  const { role } = useAuth();
  const { data: profile, isLoading } = useProfile();

  return useMemo(() => {
    if (isLoading || !profile || !role) {
      return { isComplete: true, missingFields: [] as string[], completionPercentage: 100, requiredFields: [] as FieldDef[], isLoading };
    }

    const required = [...commonFields, ...(roleFields[role] ?? [])];
    const missing: string[] = [];

    for (const f of required) {
      const val = (profile as any)[f.key];
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
  }, [profile, role, isLoading]);
}
