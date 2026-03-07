import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Info, AlertTriangle, CheckCircle, Gavel, FileSignature, Shield, CreditCard, Trash2, FolderKanban, Clock, Banknote, Snowflake, RotateCcw, HandCoins, Mail, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";

interface NotificationItemProps {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  entity_id?: string | null;
  entity_type?: string | null;
  onMarkRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

const typeConfig: Record<string, { icon: typeof Bell; label: string }> = {
  info: { icon: Info, label: "إشعار" },
  warning: { icon: AlertTriangle, label: "تنبيه" },
  success: { icon: CheckCircle, label: "نجاح" },
  bid_received: { icon: Gavel, label: "عرض سعر" },
  bid_accepted: { icon: CheckCircle, label: "قبول عرض" },
  bid_rejected: { icon: AlertTriangle, label: "رفض عرض" },
  contract_created: { icon: FileSignature, label: "عقد جديد" },
  contract_signed: { icon: FileSignature, label: "توقيع عقد" },
  escrow_created: { icon: Shield, label: "ضمان مالي" },
  escrow_released: { icon: Banknote, label: "تحرير ضمان" },
  escrow_refunded: { icon: RotateCcw, label: "استرداد ضمان" },
  escrow_frozen: { icon: Snowflake, label: "تجميد ضمان" },
  payment: { icon: CreditCard, label: "دفع" },
  purchase: { icon: HandCoins, label: "شراء" },
  purchase_confirmation: { icon: CheckCircle, label: "تأكيد شراء" },
  project_open: { icon: FolderKanban, label: "طلب مفتوح" },
  project_in_progress: { icon: FolderKanban, label: "طلب قيد التنفيذ" },
  project_completed: { icon: CheckCircle, label: "طلب مكتمل" },
  project_cancelled: { icon: AlertTriangle, label: "طلب ملغي" },
  project_disputed: { icon: Gavel, label: "طلب مُشتكى عليه" },
  project_suspended: { icon: AlertTriangle, label: "طلب معلق" },
  dispute_opened: { icon: Gavel, label: "شكوى مفتوحة" },
  dispute_resolved: { icon: CheckCircle, label: "شكوى محلولة" },
  timelog_approved: { icon: Clock, label: "وقت معتمد" },
  timelog_rejected: { icon: Clock, label: "وقت مرفوض" },
  withdrawal_approved: { icon: Banknote, label: "سحب موافق" },
  withdrawal_rejected: { icon: Banknote, label: "سحب مرفوض" },
  withdrawal_processed: { icon: Banknote, label: "سحب محوّل" },
  message_received: { icon: Mail, label: "رسالة جديدة" },
  service_approved: { icon: CheckCircle, label: "خدمة معتمدة" },
  service_rejected: { icon: AlertTriangle, label: "خدمة مرفوضة" },
  service_suspended: { icon: AlertTriangle, label: "خدمة معلقة" },
  service_purchased: { icon: HandCoins, label: "شراء خدمة" },
  time_log_approval: { icon: Clock, label: "اعتماد وقت" },
  timelog_submitted: { icon: ClipboardList, label: "تسجيل ساعات" },
};

function getEntityLink(entityType?: string | null, entityId?: string | null): string | null {
  if (!entityType || !entityId) return null;
  switch (entityType) {
    case "project":
      return `/projects/${entityId}`;
    case "service":
      return `/services/${entityId}`;
    case "dispute":
      return `/disputes/${entityId}`;
    case "message":
      return `/messages`;
    case "ticket":
      return `/tickets/${entityId}`;
    case "withdrawal":
      return `/earnings`;
    case "grant_request":
      return `/my-grant-requests`;
    default:
      return null;
  }
}

function renderMessage(message: string) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(message)) !== null) {
    if (match.index > lastIndex) parts.push(message.slice(lastIndex, match.index));
    parts.push(
      <Link key={match.index} to={match[2]} className="text-primary underline underline-offset-2 hover:text-primary/80">
        {match[1]}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < message.length) parts.push(message.slice(lastIndex));
  return parts.length > 0 ? parts : message;
}

export function NotificationItem({ id, message, type, is_read, created_at, entity_id, entity_type, onMarkRead, onDelete }: NotificationItemProps) {
  const config = typeConfig[type] || { icon: Bell, label: type };
  const Icon = config.icon;
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const link = getEntityLink(entity_type, entity_id);

  const handleClick = () => {
    if (!is_read) onMarkRead(id);
    // Invalidate queries so target page shows fresh data
    queryClient.invalidateQueries();
    if (link) navigate(link);
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 ${link ? "cursor-pointer hover:shadow-md" : ""} ${is_read ? "bg-card" : "bg-accent/30 border-primary/20"}`}
      >
        <div className="shrink-0 mt-0.5">
          <div className={`rounded-full p-1.5 ${is_read ? "bg-muted" : "bg-primary/10"}`}>
            <Icon className={`h-4 w-4 ${is_read ? "text-muted-foreground" : "text-primary"}`} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{config.label}</span>
          </div>
          <p className={`text-sm ${is_read ? "text-muted-foreground" : "text-foreground font-medium"}`}>{renderMessage(message)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: ar })}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {!is_read && (
            <Button variant="ghost" size="sm" onClick={() => onMarkRead(id)}>
              تم القراءة
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(true)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title="حذف الإشعار"
        description="هل أنت متأكد من حذف هذا الإشعار؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={() => {
          onDelete?.(id);
          setDeleteConfirm(false);
        }}
      />
    </>
  );
}
