import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RELAY_URL = "https://api.sharedservices.solutions/send-email.php";
const PLATFORM_NAME = "منصة الخدمات المشتركة للجمعيات الشبابية";
const SITE_URL = "https://youth-hub-sa.lovable.app";

/* ─── defaults per notification type ─── */
const DEFAULT_ENABLED: Record<string, boolean> = {
  bid_accepted: true, bid_rejected: true, project_completed: true,
  project_cancelled: true, project_disputed: true, contract_created: true,
  contract_signed: true, escrow_released: true, escrow_refunded: true,
  withdrawal_approved: true, withdrawal_rejected: true, withdrawal_processed: true,
  service_approved: true, service_rejected: true, bank_transfer_approved: true,
  bank_transfer_rejected: true, invoice_created: true, dispute_opened: true,
  dispute_resolved: true, grant_request_approved: true, grant_request_rejected: true,
  grant_request_funded: true, grant_request_received: true, bank_transfer_pending: true,
  deliverable_accepted: true, deliverable_revision: true, message_received: true,
  bid_received: true, escrow_created: true, escrow_frozen: true,
  timelog_approved: true, timelog_rejected: true, timelog_submitted: true,
  project_in_progress: true, project_open: true, project_suspended: true,
  service_purchased: true, service_suspended: true, deliverable_submitted: true,
  bid_comment: true, contact_message: true, donation_received: true,
  inquiry_created: true, inquiry_message: true,
};

function isTypeEnabled(preferences: Record<string, boolean> | null, type: string): boolean {
  if (preferences && type in preferences) return preferences[type];
  return DEFAULT_ENABLED[type] ?? true;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ─── Custom subjects per type (default / service_provider) ─── */
const CUSTOM_SUBJECTS: Record<string, string> = {
  bid_accepted: `تم قبول عرضك - ${PLATFORM_NAME}`,
  bid_rejected: `تعذر قبول عرضك - ${PLATFORM_NAME}`,
  bid_received: `وصلكم عرض سعر جديد - ${PLATFORM_NAME}`,
  project_open: `تم فتح المشروع - ${PLATFORM_NAME}`,
  project_in_progress: `بدء العمل على المشروع - ${PLATFORM_NAME}`,
  project_completed: `تم إكمال المشروع - ${PLATFORM_NAME}`,
  project_cancelled: `تم إلغاء المشروع - ${PLATFORM_NAME}`,
  project_disputed: `تم تسجيل شكوى على المشروع - ${PLATFORM_NAME}`,
  contract_created: `تم إنشاء عقد جديد - ${PLATFORM_NAME}`,
  contract_signed: `تم توقيع العقد - ${PLATFORM_NAME}`,
  escrow_created: `تم إنشاء الضمان المالي - ${PLATFORM_NAME}`,
  escrow_released: `تم تحرير الضمان المالي - ${PLATFORM_NAME}`,
  escrow_refunded: `تم استرداد الضمان المالي - ${PLATFORM_NAME}`,
  withdrawal_approved: `تمت الموافقة على طلب السحب - ${PLATFORM_NAME}`,
  withdrawal_rejected: `تعذر الموافقة على طلب السحب - ${PLATFORM_NAME}`,
  withdrawal_processed: `تم تحويل مبلغ السحب - ${PLATFORM_NAME}`,
  service_approved: `تمت الموافقة على الخدمة - ${PLATFORM_NAME}`,
  service_rejected: `تعذر اعتماد الخدمة - ${PLATFORM_NAME}`,
  service_purchased: `تم شراء خدمتك - ${PLATFORM_NAME}`,
  timelog_approved: `تمت الموافقة على الساعات المسجلة - ${PLATFORM_NAME}`,
  timelog_rejected: `تعذر اعتماد الساعات المسجلة - ${PLATFORM_NAME}`,
  deliverable_accepted: `تم قبول التسليمات - ${PLATFORM_NAME}`,
  deliverable_revision: `مطلوب إجراء تعديلات على التسليمات - ${PLATFORM_NAME}`,
  deliverable_submitted: `تم رفع تسليم جديد على المشروع - ${PLATFORM_NAME}`,
  message_received: `لديك رسالة جديدة - ${PLATFORM_NAME}`,
  bank_transfer_approved: `تمت الموافقة على التحويل البنكي - ${PLATFORM_NAME}`,
  bank_transfer_rejected: `تعذر اعتماد التحويل البنكي - ${PLATFORM_NAME}`,
  invoice_created: `تم إصدار فاتورة جديدة - ${PLATFORM_NAME}`,
  grant_request_approved: `تمت الموافقة على طلب المنحة - ${PLATFORM_NAME}`,
  grant_request_rejected: `تعذر الموافقة على طلب المنحة - ${PLATFORM_NAME}`,
  grant_request_funded: `تم تمويل طلب المنحة - ${PLATFORM_NAME}`,
  inquiry_message: `إشعار جديد - ${PLATFORM_NAME}`,
};

/* ─── Role-specific subject overrides ─── */
const ROLE_SUBJECT_OVERRIDES: Record<string, Record<string, string>> = {
  youth_association: {
    message_received: `لديكم رسالة جديدة - ${PLATFORM_NAME}`,
    project_in_progress: `بدأ العمل على المشروع - ${PLATFORM_NAME}`,
  },
  donor: {
    donation_received: `تم استلام التبرع بنجاح - ${PLATFORM_NAME}`,
    project_completed: `تم إكمال المشروع المدعوم - ${PLATFORM_NAME}`,
    grant_request_received: `وصلكم طلب منحة جديد - ${PLATFORM_NAME}`,
    bank_transfer_pending: `طلب تحويل بنكي جديد بانتظار المراجعة - ${PLATFORM_NAME}`,
    dispute_opened: `تم تسجيل شكوى جديدة - ${PLATFORM_NAME}`,
    contact_message: `وردت رسالة تواصل جديدة - ${PLATFORM_NAME}`,
  },
};

function getSubjectForRole(type: string, role: string): string {
  const override = ROLE_SUBJECT_OVERRIDES[role]?.[type];
  if (override) return override;
  return CUSTOM_SUBJECTS[type] || `إشعار - ${PLATFORM_NAME}`;
}

/* ─── Service Provider body templates ─── */
function getProviderBody(type: string, name: string, entity: string, link: string): string[] | null {
  const templates: Record<string, string[]> = {
    bid_accepted: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم قبول العرض المقدم من قبلكم على ${entity}.`,
      `يمكنكم الآن متابعة الخطوات التالية الخاصة بالمشروع والاطلاع على التفاصيل المعتمدة من خلال الرابط التالي:`,
      link,
      `نشكر لكم تفاعلكم، ونتطلع إلى تعاون مثمر.`,
    ],
    bid_rejected: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه لم يتم قبول العرض المقدم من قبلكم على ${entity}.`,
      `يمكنكم إعادة مراجعة تفاصيل الطلب ونشره من خلال الرابط التالي:`,
      link,
    ],
    project_in_progress: [
      `مرحبًا ${name}،`,
      `يرجى متابعة حالة المشروع والالتزام بالمخرجات والمدة المحددة، ويمكنكم الاطلاع على التفاصيل من خلال الرابط التالي:`,
      link,
    ],
    project_completed: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم إكمال ${entity} بنجاح.`,
      `يمكنكم الدخول إلى المنصة للاطلاع على حالة المشروع والتفاصيل المرتبطة به عبر الرابط التالي:`,
      link,
      `شكرًا لتعاونكم.`,
    ],
    project_cancelled: [
      `مرحبًا ${name}،`,
      `نحيطكم علمًا عبر ${PLATFORM_NAME} بأنه تم إلغاء ${entity}.`,
      `يرجى مراجعة تفاصيل المشروع وأسباب الإلغاء، إن وجدت، من خلال الرابط التالي:`,
      link,
    ],
    project_disputed: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم تسجيل شكوى أو ملاحظة على ${entity}.`,
      `يرجى الدخول إلى المنصة والاطلاع على تفاصيل الشكوى واتخاذ الإجراء المناسب عبر الرابط التالي:`,
      link,
    ],
    contract_created: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم إنشاء عقد جديد مرتبط بـ ${entity}.`,
      `يرجى مراجعة العقد والاطلاع على بنوده واستكمال الإجراء المطلوب من قبلكم عبر الرابط التالي:`,
      link,
    ],
    contract_signed: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم توقيع العقد الخاص بـ ${entity} بنجاح.`,
      `يمكنكم الاطلاع على العقد ومتابعة الخطوات التالية من خلال الرابط التالي:`,
      link,
    ],
    escrow_created: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم إنشاء الضمان المالي الخاص بـ ${entity}.`,
      `يأتي ذلك ضمن إجراءات المنصة لحفظ الحقوق وتنظيم العملية التعاقدية والمالية.`,
      `يمكنكم مراجعة التفاصيل من خلال الرابط التالي:`,
      link,
    ],
    escrow_released: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم تحرير الضمان المالي المرتبط بـ ${entity}.`,
      `يمكنكم الاطلاع على تفاصيل العملية من خلال الرابط التالي:`,
      link,
    ],
    escrow_refunded: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تمت معالجة استرداد الضمان المالي الخاص بـ ${entity}.`,
      `يمكنكم مراجعة تفاصيل العملية المالية من خلال الرابط التالي:`,
      link,
    ],
    withdrawal_approved: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تمت الموافقة على طلب السحب المقدم من قبلكم.`,
      `سيتم استكمال الإجراءات المالية وفق الآلية المعتمدة في المنصة، ويمكنكم متابعة الحالة من خلال الرابط التالي:`,
      link,
    ],
    withdrawal_rejected: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه لم تتم الموافقة على طلب السحب المقدم من قبلكم في الوقت الحالي.`,
      `يرجى مراجعة تفاصيل الطلب وأسباب الرفض أو المتطلبات الإضافية، إن وجدت، من خلال الرابط التالي:`,
      link,
    ],
    withdrawal_processed: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تمت معالجة طلب السحب وتحويل المبلغ وفق البيانات المعتمدة في حسابكم.`,
      `يمكنكم مراجعة تفاصيل العملية من خلال الرابط التالي:`,
      link,
    ],
    service_approved: [
      `مرحبًا ${name}،`,
      `يسرنا إشعاركم عبر ${PLATFORM_NAME} بأنه تمت الموافقة على الخدمة ${entity}.`,
      `يمكنكم الآن متابعة حالة الخدمة واستقبال الطلبات من خلال الرابط التالي:`,
      link,
    ],
    service_rejected: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه لم تتم الموافقة على الخدمة ${entity} في الوقت الحالي.`,
      `يرجى مراجعة الملاحظات أو التعديلات المطلوبة، إن وجدت، من خلال الرابط التالي:`,
      link,
    ],
    service_purchased: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم شراء الخدمة ${entity} بنجاح.`,
      `يرجى الدخول إلى حسابكم لمراجعة تفاصيل الطلب والبدء في تنفيذ الخدمة عبر الرابط التالي:`,
      link,
    ],
    timelog_approved: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تمت الموافقة على الساعات المسجلة من قبلكم على ${entity}.`,
      `يمكنكم مراجعة الساعات المعتمدة من خلال الرابط التالي:`,
      link,
    ],
    timelog_rejected: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه لم تتم الموافقة على الساعات المسجلة من قبلكم على ${entity}.`,
      `يرجى مراجعة التفاصيل وإعادة التقديم بعد استيفاء الملاحظات المطلوبة من خلال الرابط التالي:`,
      link,
    ],
    deliverable_accepted: [
      `مرحبًا ${name}،`,
      `يسرنا إشعاركم عبر ${PLATFORM_NAME} بأنه تم قبول التسليمات الخاصة بـ ${entity}.`,
      `يمكنكم متابعة حالة المشروع أو الخدمة من خلال الرابط التالي:`,
      link,
      `شكرًا لتعاونكم والتزامكم.`,
    ],
    deliverable_revision: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بوجود ملاحظات على التسليمات المرفوعة الخاصة بـ ${entity}.`,
      `يرجى مراجعة الملاحظات وإجراء التعديلات المطلوبة ثم إعادة رفع النسخة المحدثة عبر الرابط التالي:`,
      link,
    ],
    message_received: [
      `مرحبًا ${name}،`,
      `وردتكم رسالة جديدة عبر ${PLATFORM_NAME} بخصوص ${entity}.`,
      `يمكنكم الاطلاع على محتوى الرسالة والرد عليها من خلال الرابط التالي:`,
      link,
    ],
  };
  return templates[type] || null;
}

/* ─── Youth Association body templates ─── */
function getAssociationBody(type: string, name: string, entity: string, link: string): string[] | null {
  const templates: Record<string, string[]> = {
    bid_received: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بوصول عرض سعر جديد على ${entity}.`,
      `يرجى الدخول إلى حسابكم للاطلاع على تفاصيل العرض ومراجعته واتخاذ الإجراء المناسب عبر الرابط التالي:`,
      link,
    ],
    project_open: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم نشر ${entity} وأصبح متاحًا لإستقبال العروض.`,
      `يمكنكم مراجعة تفاصيل الطلب من خلال الرابط التالي:`,
      link,
    ],
    project_in_progress: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم بدء العمل على ${entity}.`,
      `يمكنكم متابعة سير العمل والتحديثات المرتبطة بالمشروع من خلال الرابط التالي:`,
      link,
    ],
    project_completed: [
      `مرحبًا ${name}،`,
      `يسرنا إشعاركم عبر ${PLATFORM_NAME} بأنه تم إكمال ${entity} بنجاح.`,
      `يمكنكم الدخول إلى المنصة للاطلاع على التفاصيل والمخرجات المرتبطة بالمشروع من خلال الرابط التالي:`,
      link,
    ],
    project_cancelled: [
      `مرحبًا ${name}،`,
      `نحيطكم علمًا عبر ${PLATFORM_NAME} بأنه تم إلغاء ${entity}.`,
      `يرجى مراجعة تفاصيل الإلغاء من خلال الرابط التالي:`,
      link,
    ],
    project_disputed: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم تسجيل شكوى متعلقة بـ ${entity}.`,
      `يرجى الاطلاع على التفاصيل واتخاذ الإجراء المناسب من خلال الرابط التالي:`,
      link,
    ],
    contract_created: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم إنشاء عقد جديد مرتبط بـ ${entity}.`,
      `يرجى مراجعة العقد واستكمال الإجراء المطلوب من خلال الرابط التالي:`,
      link,
    ],
    contract_signed: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم توقيع العقد الخاص بـ ${entity} بنجاح.`,
      `يمكنكم الاطلاع على نسخة العقد ومتابعة الحالة من خلال الرابط التالي:`,
      link,
    ],
    escrow_created: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم إنشاء الضمان المالي الخاص بـ ${entity}.`,
      `يمكنكم مراجعة تفاصيل العملية المالية من خلال الرابط التالي:`,
      link,
    ],
    escrow_released: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم تحرير الضمان المالي المرتبط بـ ${entity}.`,
      `يمكنكم مراجعة تفاصيل العملية من خلال الرابط التالي:`,
      link,
    ],
    escrow_refunded: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تمت معالجة استرداد الضمان المالي الخاص بـ ${entity}.`,
      `يمكنكم مراجعة التفاصيل المالية من خلال الرابط التالي:`,
      link,
    ],
    bank_transfer_approved: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تمت الموافقة على طلب التحويل البنكي المرتبط بحسابكم.`,
      `يمكنكم متابعة حالة العملية عبر الرابط التالي:`,
      link,
    ],
    bank_transfer_rejected: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه لم تتم الموافقة على طلب التحويل البنكي في الوقت الحالي.`,
      `يرجى مراجعة سبب الرفض أو المتطلبات الإضافية من خلال الرابط التالي:`,
      link,
    ],
    invoice_created: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم إصدار فاتورة جديدة مرتبطة بـ ${entity}.`,
      `يرجى الدخول إلى حسابكم للاطلاع على تفاصيل الفاتورة واستكمال الإجراء المطلوب عبر الرابط التالي:`,
      link,
    ],
    deliverable_submitted: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم رفع تسليم جديد خاص بـ ${entity} من قبل مزود الخدمة.`,
      `يرجى مراجعة الملفات أو المخرجات المرفوعة واتخاذ الإجراء المناسب من خلال الرابط التالي:`,
      link,
    ],
    grant_request_approved: [
      `مرحبًا ${name}،`,
      `يسرنا إشعاركم عبر ${PLATFORM_NAME} بأنه تمت الموافقة على طلب المنحة المرتبط بـ ${entity}.`,
      `يمكنكم الاطلاع على الخطوات التالية من خلال الرابط التالي:`,
      link,
    ],
    grant_request_rejected: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه لم تتم الموافقة على طلب المنحة المرتبط بـ ${entity} في الوقت الحالي.`,
      `يرجى مراجعة التفاصيل ذات العلاقة من خلال الرابط التالي:`,
      link,
    ],
    grant_request_funded: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم تمويل طلب المنحة المرتبط بـ ${entity}.`,
      `يمكنكم الاطلاع على تفاصيل المنح والشراء من خلال الرابط التالي:`,
      link,
    ],
    message_received: [
      `مرحبًا ${name}،`,
      `وردتكم رسالة جديدة عبر ${PLATFORM_NAME} بخصوص ${entity}.`,
      `يمكنكم الاطلاع على محتوى الرسالة والرد عليها من خلال الرابط التالي:`,
      link,
    ],
    inquiry_message: [
      `مرحبًا ${name}،`,
      `وردكم إشعار جديد عبر ${PLATFORM_NAME} يتعلق بأحد الطلبات أو الاستفسارات المرتبطة بحسابكم.`,
      `يرجى مراجعة التفاصيل واتخاذ الإجراء المناسب من خلال الرابط التالي:`,
      link,
    ],
  };
  return templates[type] || null;
}

/* ─── Donor body templates ─── */
function getDonorBody(type: string, name: string, entity: string, link: string): string[] | null {
  const templates: Record<string, string[]> = {
    donation_received: [
      `مرحبًا ${name}،`,
      `نشكر لكم دعمكم الكريم، ونود إشعاركم عبر ${PLATFORM_NAME} بأنه تم استلام التبرع المرتبط بـ ${entity} بنجاح.`,
      `يمكنكم متابعة تفاصيل العملية من خلال الرابط التالي:`,
      link,
      `مع خالص الشكر والتقدير،`,
    ],
    project_completed: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم إكمال ${entity} المرتبط بدعمكم بنجاح.`,
      `نشكر لكم مساهمتكم في تحقيق هذا الأثر، ويمكنكم الاطلاع على التفاصيل من خلال الرابط التالي:`,
      link,
      `مع خالص الشكر والتقدير،`,
    ],
    grant_request_received: [
      `مرحبًا ${name}،`,
      `ورد إلى حسابكم عبر ${PLATFORM_NAME} طلب منحة جديد مرتبط بـ ${entity}.`,
      `يرجى مراجعة الطلب واتخاذ ما ترونه مناسبًا من خلال الرابط التالي:`,
      link,
    ],
    bank_transfer_pending: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بوجود طلب تحويل بنكي جديد مرتبط بأحد العمليات في المنصة وهو بانتظار المراجعة.`,
      `يمكنكم الاطلاع على التفاصيل واستكمال المتابعة من خلال الرابط التالي:`,
      link,
    ],
    dispute_opened: [
      `مرحبًا ${name}،`,
      `نود إشعاركم عبر ${PLATFORM_NAME} بأنه تم تسجيل شكوى جديدة مرتبطة بـ ${entity}.`,
      `يرجى مراجعة التفاصيل واتخاذ الإجراء المناسب وفق الصلاحيات المتاحة من خلال الرابط التالي:`,
      link,
    ],
    contact_message: [
      `مرحبًا ${name}،`,
      `وردتكم رسالة تواصل جديدة عبر ${PLATFORM_NAME} مرتبطة بـ ${entity}.`,
      `يمكنكم الاطلاع على محتوى الرسالة ومتابعتها من خلال الرابط التالي:`,
      link,
    ],
  };
  return templates[type] || null;
}

/* ─── Role-aware body resolver ─── */
function getCustomBodyForRole(type: string, role: string, recipientName: string, entityName: string, actionUrl: string): string[] | null {
  const name = recipientName || "";
  const entity = entityName || "الطلب";

  if (role === "donor") {
    const body = getDonorBody(type, name, entity, actionUrl);
    if (body) return body;
  }

  if (role === "youth_association") {
    const body = getAssociationBody(type, name, entity, actionUrl);
    if (body) return body;
  }

  if (role === "service_provider") {
    const body = getProviderBody(type, name, entity, actionUrl);
    if (body) return body;
  }

  // Fallback: try provider templates for any role (covers shared types)
  return getProviderBody(type, name, entity, actionUrl);
}

/* ─── Build action URL from entity ─── */
function buildActionUrl(entityType: string | null, entityId: string | null): string {
  if (!entityType || !entityId) return `${SITE_URL}/notifications`;
  const map: Record<string, string> = {
    project: `/projects/${entityId}`,
    service: `/marketplace/${entityId}`,
    dispute: `/my-disputes`,
    message: `/messages`,
    invoice: `/invoices`,
    withdrawal: `/earnings`,
    ticket: `/support-tickets/${entityId}`,
    grant_request: `/my-grant-requests`,
    escrow: `/earnings`,
  };
  return `${SITE_URL}${map[entityType] || "/notifications"}`;
}

/* ─── Fetch entity name from DB ─── */
async function fetchEntityName(
  supabaseAdmin: ReturnType<typeof createClient>,
  entityType: string | null,
  entityId: string | null
): Promise<string> {
  if (!entityType || !entityId) return "";
  try {
    if (entityType === "project") {
      const { data } = await supabaseAdmin.from("projects").select("title").eq("id", entityId).single();
      return data?.title || "";
    }
    if (entityType === "service") {
      const { data } = await supabaseAdmin.from("micro_services").select("title").eq("id", entityId).single();
      return data?.title || "";
    }
  } catch { /* ignore */ }
  return "";
}

/* ─── Fetch user role ─── */
async function fetchUserRole(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string
): Promise<string> {
  try {
    const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).single();
    return data?.role || "service_provider";
  } catch {
    return "service_provider";
  }
}

/* ─── Build email HTML ─── */
function buildEmailHTML(paragraphs: string[], actionUrl: string): string {
  const bodyContent = paragraphs.map((p) => {
    if (p.startsWith("http")) {
      return `<a href="${escapeHtml(p)}" style="display:inline-block;margin:8px 0;padding:10px 28px;background:#0f766e;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;">عرض التفاصيل</a>`;
    }
    return `<p style="margin:0 0 10px;color:#334155;font-size:15px;line-height:1.8;">${escapeHtml(p)}</p>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Tahoma,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#0f766e,#14b8a6);padding:24px 30px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:22px;">${escapeHtml(PLATFORM_NAME)}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:30px;">
        <div style="background:#f8fafc;border-right:4px solid #14b8a6;padding:20px 24px;border-radius:8px;">
          ${bodyContent}
        </div>
        <p style="margin:20px 0 0;color:#64748b;font-size:13px;text-align:center;">مع خالص التقدير،<br>فريق ${escapeHtml(PLATFORM_NAME)}</p>
      </td>
    </tr>
    <tr>
      <td style="background:#f8fafc;padding:16px 30px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:11px;">هذا البريد تم إرساله تلقائياً من ${escapeHtml(PLATFORM_NAME)}. يمكنك إيقاف إشعارات البريد من إعدادات حسابك.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ─── Fallback for types without custom templates ─── */
function buildFallbackHTML(toName: string, message: string, type: string): string {
  const typeLabels: Record<string, string> = {
    info: "إشعار", bid_received: "عرض سعر جديد", bid_accepted: "تم قبول عرضك",
    bid_rejected: "تم رفض عرضك", bid_comment: "تعليق على عرض", contract_created: "عقد جديد",
    contract_signed: "توقيع عقد", escrow_created: "ضمان مالي", escrow_released: "تحرير ضمان مالي",
    escrow_refunded: "استرداد ضمان مالي", escrow_frozen: "تجميد ضمان مالي", project_open: "مشروع مفتوح",
    project_in_progress: "بدء العمل", project_completed: "إكمال مشروع", project_cancelled: "إلغاء مشروع",
    project_disputed: "شكوى على مشروع", project_suspended: "تعليق مشروع", dispute_opened: "شكوى جديدة",
    dispute_resolved: "حل شكوى", service_approved: "الموافقة على خدمة", service_rejected: "رفض خدمة",
    service_suspended: "تعليق خدمة", service_purchased: "شراء خدمة", withdrawal_approved: "الموافقة على سحب",
    withdrawal_rejected: "رفض سحب", withdrawal_processed: "تحويل سحب", bank_transfer_pending: "تحويل بنكي جديد",
    bank_transfer_approved: "الموافقة على تحويل", bank_transfer_rejected: "رفض تحويل",
    invoice_created: "فاتورة جديدة", timelog_submitted: "تسجيل ساعات", timelog_approved: "الموافقة على ساعات",
    timelog_rejected: "رفض ساعات", deliverable_submitted: "تسليم ملفات", deliverable_accepted: "قبول تسليمات",
    deliverable_revision: "طلب تعديلات", message_received: "رسالة جديدة",
    grant_request_received: "طلب منحة", grant_request_approved: "الموافقة على منحة",
    grant_request_rejected: "رفض منحة", grant_request_funded: "تمويل منحة",
    contact_message: "رسالة تواصل", donation_received: "تبرع جديد",
  };
  const label = typeLabels[type] || "إشعار";
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Tahoma,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#0f766e,#14b8a6);padding:24px 30px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:22px;">${escapeHtml(PLATFORM_NAME)}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:30px;">
        <p style="margin:0 0 8px;color:#64748b;font-size:13px;">${escapeHtml(label)}</p>
        <p style="margin:0 0 16px;color:#1e293b;font-size:15px;">مرحباً ${escapeHtml(toName || "")}</p>
        <div style="background:#f8fafc;border-right:4px solid #14b8a6;padding:16px 20px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">${escapeHtml(message)}</p>
        </div>
        <a href="${SITE_URL}/notifications" style="display:inline-block;margin-top:20px;padding:10px 28px;background:#0f766e;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;">عرض الإشعارات</a>
        <p style="margin:20px 0 0;color:#64748b;font-size:13px;text-align:center;">مع خالص التقدير،<br>فريق ${escapeHtml(PLATFORM_NAME)}</p>
      </td>
    </tr>
    <tr>
      <td style="background:#f8fafc;padding:16px 30px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:11px;">هذا البريد تم إرساله تلقائياً من ${escapeHtml(PLATFORM_NAME)}. يمكنك إيقاف إشعارات البريد من إعدادات حسابك.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let notificationId: string | undefined;

  try {
    const { notification_id } = await req.json();
    notificationId = notification_id;

    if (!notification_id) {
      return new Response(JSON.stringify({ error: "Missing notification_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: notification, error: nErr } = await supabaseAdmin
      .from("notifications").select("*").eq("id", notification_id).single();

    if (nErr || !notification) {
      console.error("Notification not found:", nErr);
      return new Response(JSON.stringify({ error: "Notification not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch profile and role in parallel
    const [profileResult, roleResult] = await Promise.all([
      supabaseAdmin.from("profiles").select("full_name, email_notifications, notification_preferences")
        .eq("id", notification.user_id).single(),
      fetchUserRole(supabaseAdmin, notification.user_id),
    ]);

    const { data: profile, error: pErr } = profileResult;
    const userRole = roleResult;

    if (pErr || !profile) {
      return new Response(JSON.stringify({ skipped: true, reason: "profile_not_found" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!profile.email_notifications) {
      return new Response(JSON.stringify({ skipped: true, reason: "master_disabled" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prefs = (profile.notification_preferences as Record<string, boolean>) || {};
    if (!isTypeEnabled(prefs, notification.type)) {
      return new Response(JSON.stringify({ skipped: true, reason: "type_disabled" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: authUser, error: aErr } = await supabaseAdmin.auth.admin.getUserById(notification.user_id);
    if (aErr || !authUser?.user?.email) {
      return new Response(JSON.stringify({ skipped: true, reason: "no_email" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userEmail = authUser.user.email;
    const userName = profile.full_name || "";

    // Build email - use role-aware custom template if available, otherwise fallback
    const actionUrl = buildActionUrl(notification.entity_type, notification.entity_id);
    const entityName = await fetchEntityName(supabaseAdmin, notification.entity_type, notification.entity_id);
    const customBody = getCustomBodyForRole(notification.type, userRole, userName, entityName, actionUrl);

    let subject: string;
    let html: string;

    if (customBody) {
      subject = getSubjectForRole(notification.type, userRole);
      html = buildEmailHTML(customBody, actionUrl);
    } else {
      subject = `${notification.type === "info" ? "إشعار" : notification.type} - ${PLATFORM_NAME}`;
      html = buildFallbackHTML(userName, notification.message, notification.type);
    }

    const relayApiKey = Deno.env.get("RELAY_API_KEY");
    if (!relayApiKey) throw new Error("RELAY_API_KEY secret is not configured");

    const relayResponse = await fetch(RELAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": relayApiKey },
      body: JSON.stringify({ to: userEmail, subject, body: html }),
    });

    if (!relayResponse.ok) {
      const errorText = await relayResponse.text();
      throw new Error(`Relay returned ${relayResponse.status}: ${errorText}`);
    }

    const relayResult = await relayResponse.text();
    console.log(`📧 Relay response: ${relayResult}`);

    await supabaseAdmin.from("notifications").update({ delivery_status: "email_sent" }).eq("id", notification_id);

    console.log(`📧 Email sent to ${userEmail} for type "${notification.type}" role "${userRole}"`);

    return new Response(
      JSON.stringify({ success: true, to: userEmail, type: notification.type, role: userRole }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-notification-email:", error);
    if (notificationId) {
      try {
        await supabaseAdmin.from("notifications").update({ delivery_status: "failed" }).eq("id", notificationId);
      } catch (dbErr) {
        console.error("Failed to update delivery_status:", dbErr);
      }
    }
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
