/** Central Arabic labels for every notification type used across the platform */
export const notificationTypeLabels: Record<string, string> = {
  // عروض الأسعار
  bid_received: "عرض سعر مستلم",
  bid_accepted: "عرض سعر مقبول",
  bid_rejected: "عرض سعر مرفوض",
  bid_comment: "تعليق على عرض سعر",

  // الخدمات
  service_approval: "طلب اعتماد خدمة",
  service_approved: "خدمة مُعتمدة",
  service_rejected: "خدمة مرفوضة",
  service_suspended: "خدمة مُعلّقة",
  service_purchased: "خدمة مُشتراة",

  // العقود
  contract_created: "عقد جديد",
  contract_signed: "توقيع عقد",

  // الضمان المالي
  escrow_created: "ضمان مالي جديد",
  escrow_released: "تحرير ضمان مالي",
  escrow_refunded: "استرداد ضمان مالي",
  escrow_frozen: "تجميد ضمان مالي",

  // المشاريع / الطلبات
  project_pending_approval: "طلب بانتظار الاعتماد",
  project_open: "طلب مفتوح",
  project_in_progress: "طلب قيد التنفيذ",
  project_completed: "طلب مكتمل",
  project_cancelled: "طلب ملغي",
  project_disputed: "طلب مُشتكى عليه",
  project_suspended: "طلب مُعلّق",

  // الشكاوى
  dispute_opened: "شكوى جديدة",
  dispute_resolved: "شكوى محلولة",

  // المدفوعات والمشتريات
  payment: "عملية دفع",
  purchase: "عملية شراء",
  purchase_confirmation: "تأكيد شراء",

  // التحويلات البنكية
  bank_transfer_pending: "تحويل بنكي بانتظار المراجعة",
  bank_transfer_approved: "تحويل بنكي مُعتمد",
  bank_transfer_rejected: "تحويل بنكي مرفوض",

  // سجلات الوقت
  time_log_approval: "اعتماد سجل وقت",
  timelog_approved: "سجل وقت مُعتمد",
  timelog_rejected: "سجل وقت مرفوض",
  timelog_submitted: "تسجيل ساعات عمل",

  // السحوبات
  withdrawal_approved: "طلب سحب مُعتمد",
  withdrawal_rejected: "طلب سحب مرفوض",
  withdrawal_processed: "تحويل مبلغ سحب",

  // الرسائل
  message_received: "رسالة جديدة",
  contact_message: "رسالة تواصل",

  // التبرعات والمنح
  donation_received: "تبرع مستلم",
  grant_request_received: "طلب منحة مستلم",
  grant_request_approved: "طلب منحة مُعتمد",
  grant_request_rejected: "طلب منحة مرفوض",
  grant_request_funded: "طلب منحة مموّل",

  // الفواتير
  invoice_created: "فاتورة جديدة",

  // طلبات التعديل
  edit_request: "طلب تعديل",

  // عام
  info: "إشعار عام",
  warning: "تنبيه",
  success: "نجاح",
};

/** Get Arabic label for a notification type, never returns raw English keys */
export function getNotificationLabel(type: string): string {
  return notificationTypeLabels[type] || "إشعار";
}
