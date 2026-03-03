export type AppRole = "super_admin" | "youth_association" | "service_provider" | "donor";

export interface NotificationType {
  key: string;
  label: string;
}

export interface NotificationGroup {
  groupLabel: string;
  types: NotificationType[];
}

const SERVICE_PROVIDER_GROUPS: NotificationGroup[] = [
  {
    groupLabel: "العروض والمشاريع",
    types: [
      { key: "bid_accepted", label: "قبول عرض السعر" },
      { key: "bid_rejected", label: "رفض عرض السعر" },
      { key: "project_in_progress", label: "بدء العمل على مشروع" },
      { key: "project_completed", label: "إكمال المشروع" },
      { key: "project_cancelled", label: "إلغاء المشروع" },
      { key: "project_disputed", label: "فتح نزاع" },
    ],
  },
  {
    groupLabel: "العقود",
    types: [
      { key: "contract_created", label: "إنشاء عقد جديد" },
      { key: "contract_signed", label: "توقيع عقد" },
    ],
  },
  {
    groupLabel: "المالية",
    types: [
      { key: "escrow_created", label: "إنشاء ضمان مالي" },
      { key: "escrow_released", label: "تحرير ضمان مالي" },
      { key: "escrow_refunded", label: "استرداد ضمان مالي" },
      { key: "withdrawal_approved", label: "الموافقة على طلب سحب" },
      { key: "withdrawal_rejected", label: "رفض طلب سحب" },
      { key: "withdrawal_processed", label: "تحويل مبلغ السحب" },
    ],
  },
  {
    groupLabel: "الخدمات",
    types: [
      { key: "service_approved", label: "الموافقة على خدمة" },
      { key: "service_rejected", label: "رفض خدمة" },
      { key: "service_purchased", label: "شراء خدمة" },
    ],
  },
  {
    groupLabel: "سجل الوقت",
    types: [
      { key: "timelog_approved", label: "الموافقة على سجل الوقت" },
      { key: "timelog_rejected", label: "رفض سجل الوقت" },
    ],
  },
  {
    groupLabel: "التواصل",
    types: [
      { key: "message_received", label: "رسالة جديدة" },
    ],
  },
];

const YOUTH_ASSOCIATION_GROUPS: NotificationGroup[] = [
  {
    groupLabel: "العروض والمشاريع",
    types: [
      { key: "bid_received", label: "استلام عرض سعر جديد" },
      { key: "project_open", label: "الموافقة على المشروع" },
      { key: "project_in_progress", label: "بدء العمل" },
      { key: "project_completed", label: "إكمال المشروع" },
      { key: "project_cancelled", label: "إلغاء المشروع" },
      { key: "project_disputed", label: "فتح نزاع" },
    ],
  },
  {
    groupLabel: "العقود",
    types: [
      { key: "contract_created", label: "إنشاء عقد" },
      { key: "contract_signed", label: "توقيع عقد" },
    ],
  },
  {
    groupLabel: "المالية",
    types: [
      { key: "escrow_created", label: "إنشاء ضمان مالي" },
      { key: "escrow_released", label: "تحرير ضمان" },
      { key: "escrow_refunded", label: "استرداد ضمان" },
      { key: "bank_transfer_approved", label: "الموافقة على تحويل بنكي" },
      { key: "bank_transfer_rejected", label: "رفض تحويل بنكي" },
    ],
  },
  {
    groupLabel: "التواصل",
    types: [
      { key: "message_received", label: "رسالة جديدة" },
    ],
  },
];

const DONOR_GROUPS: NotificationGroup[] = [
  {
    groupLabel: "التبرعات",
    types: [
      { key: "donation_received", label: "تأكيد استلام تبرع" },
      { key: "project_completed", label: "إكمال مشروع مدعوم" },
    ],
  },
];

const SUPER_ADMIN_GROUPS: NotificationGroup[] = [
  {
    groupLabel: "الإدارة",
    types: [
      { key: "bank_transfer_pending", label: "تحويل بنكي جديد بانتظار المراجعة" },
      { key: "dispute_opened", label: "نزاع جديد" },
    ],
  },
];

const ROLE_GROUPS: Record<AppRole, NotificationGroup[]> = {
  service_provider: SERVICE_PROVIDER_GROUPS,
  youth_association: YOUTH_ASSOCIATION_GROUPS,
  donor: DONOR_GROUPS,
  super_admin: SUPER_ADMIN_GROUPS,
};

export function getPreferencesForRole(role: AppRole): NotificationGroup[] {
  return ROLE_GROUPS[role] ?? [];
}

export function isNotificationEnabled(
  preferences: Record<string, boolean>,
  type: string
): boolean {
  // If key is missing, default to enabled
  return preferences[type] !== false;
}

export function getAllKeysForRole(role: AppRole): string[] {
  return getPreferencesForRole(role).flatMap((g) => g.types.map((t) => t.key));
}
