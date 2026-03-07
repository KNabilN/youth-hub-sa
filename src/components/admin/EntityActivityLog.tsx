import { useEntityAuditLog } from "@/hooks/useEntityAuditLog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

const actionLabels: Record<string, string> = {
  INSERT: "إنشاء",
  UPDATE: "تعديل",
  DELETE: "حذف",
  suspend: "تعليق",
  unsuspend: "إلغاء تعليق",
  approve: "موافقة",
  reject: "رفض",
  reactivate: "إعادة تفعيل",
};

const actionColors: Record<string, string> = {
  INSERT: "bg-emerald-500/10 text-emerald-600",
  UPDATE: "bg-primary/10 text-primary",
  DELETE: "bg-destructive/10 text-destructive",
  suspend: "bg-orange-500/10 text-orange-600",
  unsuspend: "bg-emerald-500/10 text-emerald-600",
  approve: "bg-emerald-500/10 text-emerald-600",
  reject: "bg-destructive/10 text-destructive",
  reactivate: "bg-emerald-500/10 text-emerald-600",
};

// Field name translations
const fieldLabels: Record<string, string> = {
  title: "العنوان",
  description: "الوصف",
  status: "الحالة",
  approval: "حالة الموافقة",
  price: "السعر",
  budget: "الميزانية",
  estimated_hours: "الساعات المقدرة",
  full_name: "الاسم الكامل",
  organization_name: "اسم المنظمة",
  phone: "الهاتف",
  bio: "النبذة",
  skills: "المهارات",
  hourly_rate: "سعر الساعة",
  is_verified: "التوثيق",
  is_suspended: "التعليق",
  is_featured: "مميز",
  is_private: "خاص",
  is_name_visible: "إظهار الاسم",
  terms: "شروط العقد",
  cover_letter: "خطاب التغطية",
  timeline_days: "المدة (أيام)",
  resolution_notes: "ملاحظات الحل",
  display_order: "ترتيب العرض",
  service_type: "نوع الخدمة",
  required_skills: "المهارات المطلوبة",
  category_id: "التصنيف",
  region_id: "المنطقة",
  city_id: "المدينة",
  amount: "المبلغ",
  hours: "الساعات",
  log_date: "تاريخ السجل",
  rejection_reason: "سبب الرفض",
  suspension_reason: "سبب التعليق",
  notes: "ملاحظات",
  priority: "الأولوية",
  subject: "الموضوع",
  long_description: "الوصف التفصيلي",
  email_notifications: "إشعارات البريد",
  image_url: "صورة",
  provider_signed_at: "توقيع مقدم الخدمة",
  association_signed_at: "توقيع الجمعية",
};

// Value translations for common status fields
const valueLabels: Record<string, Record<string, string>> = {
  status: {
    draft: "مسودة",
    pending_approval: "بانتظار الموافقة",
    open: "مفتوح",
    in_progress: "قيد التنفيذ",
    completed: "مكتمل",
    cancelled: "ملغي",
    disputed: "مُتنازع عليه",
    suspended: "معلق",
    pending: "معلق",
    approved: "موافق عليه",
    rejected: "مرفوض",
    resolved: "تم الحل",
    closed: "مغلق",
    under_review: "قيد المراجعة",
    issued: "صادرة",
    viewed: "تم الاطلاع",
    held: "محتجز",
    released: "محرر",
    refunded: "مسترد",
    frozen: "مجمد",
    funded: "ممول",
    pending_review: "بانتظار المراجعة",
    accepted: "مقبول",
    revision_requested: "مطلوب تعديل",
  },
  approval: {
    pending: "معلق",
    approved: "معتمد",
    rejected: "مرفوض",
    suspended: "معلق",
  },
  priority: {
    low: "منخفضة",
    medium: "متوسطة",
    high: "عالية",
    urgent: "عاجلة",
  },
  service_type: {
    fixed_price: "سعر ثابت",
    hourly: "بالساعة",
  },
};

// Keys to always skip in change display
const skipKeys = new Set([
  "id", "created_at", "updated_at", "deleted_at", "user_id", "provider_id",
  "association_id", "assigned_provider_id", "project_id", "contract_id",
  "escrow_id", "bid_id", "dispute_id", "donor_id", "payer_id", "payee_id",
  "beneficiary_id", "actor_id", "changed_by", "reviewed_by", "rater_id",
  "raised_by", "author_id", "sender_id", "target_id", "target_user_id",
  "requested_by", "suggested_by", "contribution_id", "grant_request_id",
  "service_id", "category_id", "region_id", "city_id", "entity_id",
  "user_number", "request_number", "service_number", "dispute_number",
  "escrow_number", "ticket_number", "transfer_number", "invoice_number",
  "withdrawal_number",
  "notification_preferences", "qualifications", "gallery", "packages", "faq",
  "pdpl_consent_at", "pdpl_consent_version",
  "avatar_url", "cover_image_url", "company_logo_url", "image_url",
  "file_path", "file_name", "mime_type", "file_size",
  "receipt_url", "attachment_url", "attachment_name",
  "profile_views", "service_views", "sales_count",
]);

function isUUID(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

function formatValue(key: string, val: any): string {
  if (val == null) return "—";
  const strVal = String(val);
  if (isUUID(strVal)) return "—";
  // Check for value translations
  if (valueLabels[key]?.[strVal]) return valueLabels[key][strVal];
  // Booleans
  if (val === true) return "نعم";
  if (val === false) return "لا";
  // Truncate long strings
  if (strVal.length > 60) return strVal.slice(0, 57) + "...";
  return strVal;
}

function ChangeSummary({ oldValues, newValues }: { oldValues: any; newValues: any }) {
  if (!oldValues && !newValues) return null;

  const changes: { key: string; label: string; from: string; to: string }[] = [];

  if (oldValues && newValues) {
    for (const key of Object.keys(newValues)) {
      if (skipKeys.has(key)) continue;
      const oldVal = oldValues[key];
      const newVal = newValues[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        // Skip JSON objects/arrays
        if (typeof newVal === "object" && newVal !== null) continue;
        if (typeof oldVal === "object" && oldVal !== null && !Array.isArray(oldVal)) continue;
        changes.push({
          key,
          label: fieldLabels[key] || key,
          from: formatValue(key, oldVal),
          to: formatValue(key, newVal),
        });
      }
    }
  }

  if (changes.length === 0) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {changes.slice(0, 5).map((c) => (
        <p key={c.key} className="text-[11px] text-muted-foreground">
          <span className="font-medium">{c.label}</span>: {c.from} → {c.to}
        </p>
      ))}
      {changes.length > 5 && (
        <p className="text-[11px] text-muted-foreground">+{changes.length - 5} تغييرات أخرى</p>
      )}
    </div>
  );
}

interface EntityActivityLogProps {
  tableName: string;
  recordId: string | null;
  maxHeight?: string;
}

export function EntityActivityLog({ tableName, recordId, maxHeight = "400px" }: EntityActivityLogProps) {
  const { data, isLoading } = useEntityAuditLog(tableName, recordId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!data?.length) {
    return <p className="text-center text-muted-foreground py-8">لا يوجد سجل نشاط</p>;
  }

  return (
    <ScrollArea style={{ maxHeight }}>
      <div className="space-y-2">
        {data.map((entry: any) => (
          <div key={entry.id} className="border rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge className={actionColors[entry.action] || "bg-muted text-muted-foreground"}>
                  {actionLabels[entry.action] || entry.action}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {(entry as any).profiles?.full_name || "النظام"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {format(new Date(entry.created_at), "yyyy/MM/dd HH:mm", { locale: ar })}
              </span>
            </div>
            <ChangeSummary oldValues={entry.old_values} newValues={entry.new_values} />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
