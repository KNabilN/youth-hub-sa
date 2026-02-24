import { Bell, Info, AlertTriangle, CheckCircle, Gavel, FileSignature, Shield, CreditCard, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface NotificationItemProps {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
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
  contract_signed: { icon: FileSignature, label: "توقيع عقد" },
  escrow_created: { icon: Shield, label: "ضمان مالي" },
  payment: { icon: CreditCard, label: "دفع" },
  dispute_opened: { icon: AlertTriangle, label: "نزاع" },
  dispute_resolved: { icon: CheckCircle, label: "تسوية" },
};

export function NotificationItem({ id, message, type, is_read, created_at, onMarkRead, onDelete }: NotificationItemProps) {
  const config = typeConfig[type] || { icon: Bell, label: type };
  const Icon = config.icon;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${is_read ? "bg-card" : "bg-accent/30 border-primary/20"}`}>
      <div className="shrink-0 mt-0.5">
        <div className={`rounded-full p-1.5 ${is_read ? "bg-muted" : "bg-primary/10"}`}>
          <Icon className={`h-4 w-4 ${is_read ? "text-muted-foreground" : "text-primary"}`} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{config.label}</span>
        </div>
        <p className={`text-sm ${is_read ? "text-muted-foreground" : "text-foreground font-medium"}`}>{message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: ar })}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!is_read && (
          <Button variant="ghost" size="sm" onClick={() => onMarkRead(id)}>
            تم القراءة
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
