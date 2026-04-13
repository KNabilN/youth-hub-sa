import { useProfile, useBankDetails } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";

interface FieldDef {
  key: string;
  label: string;
  source: "profile" | "bank";
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
  ],
  donor: [],
  super_admin: [],
};

export function useProfileCompleteness() {
  const { role } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: bankDetails, isLoading: bankLoading } = useBankDetails();

  const isLoading = profileLoading || bankLoading;

  return useMemo(() => {
    if (isLoading || !profile || !role) {
      return { isComplete: true, missingFields: [] as string[], completionPercentage: 100, requiredFields: [] as FieldDef[], isLoading };
    }

    const required = [...commonFields, ...(roleFields[role] ?? [])];
    const missing: string[] = [];

    for (const f of required) {
      const source = f.source === "bank" ? (bankDetails ?? {}) : profile;
      const val = (source as any)[f.key];
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
  }, [profile, bankDetails, role, isLoading]);
}
