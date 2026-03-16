export type AppRole = "super_admin" | "youth_association" | "service_provider" | "donor";

export interface NotificationType {
  key: string;
  label: string;
  defaultEnabled: boolean;
}

export interface NotificationGroup {
  groupLabel: string;
  types: NotificationType[];
}

const SERVICE_PROVIDER_GROUPS: NotificationGroup[] = [
  {
    groupLabel: "العروض والمشاريع",
    types: [
      { key: "bid_accepted", label: "قبول عرض السعر", defaultEnabled: true },
      { key: "bid_rejected", label: "رفض عرض السعر", defaultEnabled: true },
      { key: "project_in_progress", label: "بدء العمل على مشروع", defaultEnabled: true },
      { key: "project_completed", label: "إكمال المشروع", defaultEnabled: true },
      { key: "project_cancelled", label: "إلغاء المشروع", defaultEnabled: true },
      { key: "project_disputed", label: "فتح شكوى", defaultEnabled: true },
    ],
  },
  {
    groupLabel: "العقود",
    types: [
      { key: "contract_created", label: "إنشاء عقد جديد", defaultEnabled: true },
      { key: "contract_signed", label: "توقيع عقد", defaultEnabled: true },
    ],
  },
  {
    groupLabel: "المالية",
    types: [
      { key: "escrow_created", label: "إنشاء ضمان مالي", defaultEnabled: true },
      { key: "escrow_released", label: "تحرير ضمان مالي", defaultEnabled: true },
      { key: "escrow_refunded", label: "استرداد ضمان مالي", defaultEnabled: true },
      { key: "withdrawal_approved", label: "الموافقة على طلب سحب", defaultEnabled: true },
      { key: "withdrawal_rejected", label: "رفض طلب سحب", defaultEnabled: true },
      { key: "withdrawal_processed", label: "تحويل مبلغ السحب", defaultEnabled: true },
    ],
  },
  {
    groupLabel: "الخدمات",
    types: [
      { key: "service_approved", label: "الموافقة على خدمة", defaultEnabled: true },
      { key: "service_rejected", label: "رفض خدمة", defaultEnabled: true },
      { key: "service_purchased", label: "شراء خدمة", defaultEnabled: true },
    ],
  },
  {
    groupLabel: "سجل الوقت",
    types: [
      { key: "timelog_approved", label: "الموافقة على سجل الوقت", defaultEnabled: false },
      { key: "timelog_rejected", label: "رفض سجل الوقت", defaultEnabled: false },
    ],
  },
  {
    groupLabel: "التسليمات",
    types: [
      { key: "deliverable_accepted", label: "قبول التسليمات", defaultEnabled: true },
      { key: "deliverable_revision", label: "طلب تعديلات على التسليمات", defaultEnabled: true },
    ],
  },
  {
    groupLabel: "التواصل",
    types: [
      { key: "message_received", label: "رسالة جديدة", defaultEnabled: false },
    ],
  },
];

const YOUTH_ASSOCIATION_GROUPS: NotificationGroup[] = [
  {
    groupLabel: "العروض والمشاريع",
    types: [
      { key: "bid_received", label: "استلام عرض سعر جديد", defaultEnabled: false },
      { key: "project_open", label: "الموافقة على المشروع", defaultEnabled: false },
      { key: "project_in_progress", label: "بدء العمل", defaultEnabled: false },
      { key: "project_completed", label: "إكمال المشروع", defaultEnabled: true },
      { key: "project_cancelled", label: "إلغاء المشروع", defaultEnabled: true },
      { key: "project_disputed", label: "فتح شكوى", defaultEnabled: true },
    ],
  },
  {
    groupLabel: "العقود",
    types: [
      { key: "contract_created", label: "إنشاء عقد", defaultEnabled: true },
      { key: "contract_signed", label: "توقيع عقد", defaultEnabled: true },
    ],
  },
  {
    groupLabel: "المالية",
    types: [
      { key: "escrow_created", label: "إنشاء ضمان مالي", defaultEnabled: false },
      { key: "escrow_released", label: "تحرير ضمان", defaultEnabled: true },
      { key: "escrow_refunded", label: "استرداد ضمان", defaultEnabled: true },
      { key: "bank_transfer_approved", label: "الموافقة على تحويل بنكي", defaultEnabled: true },
      { key: "bank_transfer_rejected", label: "رفض تحويل بنكي", defaultEnabled: true },
      { key: "invoice_created", label: "فاتورة جديدة", defaultEnabled: true },
    ],
  },
  {
    groupLabel: "التسليمات",
    types: [
      { key: "deliverable_submitted", label: "تسليم ملفات جديدة", defaultEnabled: false },
    ],
  },
  {
    groupLabel: "المنح",
    types: [
      { key: "grant_request_approved", label: "الموافقة على طلب منحة", defaultEnabled: true },
      { key: "grant_request_rejected", label: "رفض طلب منحة", defaultEnabled: true },
      { key: "grant_request_funded", label: "تمويل طلب منحة", defaultEnabled: true },
    ],
  },
  {
    groupLabel: "التواصل",
    types: [
      { key: "message_received", label: "رسالة جديدة", defaultEnabled: false },
    ],
  },
];

const DONOR_GROUPS: NotificationGroup[] = [
  {
    groupLabel: "التبرعات والمنح",
    types: [
      { key: "donation_received", label: "تأكيد استلام تبرع", defaultEnabled: false },
      { key: "project_completed", label: "إكمال مشروع مدعوم", defaultEnabled: true },
      { key: "grant_request_received", label: "طلب منحة جديد", defaultEnabled: true },
    ],
  },
];

const SUPER_ADMIN_GROUPS: NotificationGroup[] = [
  {
    groupLabel: "الإدارة",
    types: [
      { key: "bank_transfer_pending", label: "تحويل بنكي جديد بانتظار المراجعة", defaultEnabled: true },
      { key: "dispute_opened", label: "شكوى جديدة", defaultEnabled: true },
      { key: "contact_message", label: "رسالة تواصل جديدة", defaultEnabled: false },
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

export function getDefaultForType(role: AppRole, type: string): boolean {
  const groups = ROLE_GROUPS[role] ?? [];
  for (const g of groups) {
    for (const t of g.types) {
      if (t.key === type) return t.defaultEnabled;
    }
  }
  return true;
}



export function getAllKeysForRole(role: AppRole): string[] {
  return getPreferencesForRole(role).flatMap((g) => g.types.map((t) => t.key));
}
