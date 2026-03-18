import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, CheckCircle, XCircle, Clock, RotateCcw, User, Link2, Eye, EyeOff } from "lucide-react";
import { getNotificationLabel } from "@/lib/notification-type-labels";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const statusMap: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  delivered: { label: "تم التوصيل", icon: CheckCircle, className: "bg-success/15 text-success border-success/30" },
  failed: { label: "فشل", icon: XCircle, className: "bg-destructive/15 text-destructive border-destructive/30" },
  pending: { label: "قيد الإرسال", icon: Clock, className: "bg-warning/15 text-warning border-warning/30" },
};

const entityRoutes: Record<string, (id: string) => string> = {
  project: (id) => `/admin/projects/${id}`,
  service: (id) => `/admin/services/${id}`,
  dispute: (id) => `/admin/disputes/${id}`,
  ticket: (id) => `/admin/tickets/${id}`,
  contract: (id) => `/admin/contracts`,
  escrow: (id) => `/admin/finance`,
  invoice: (id) => `/admin/finance`,
};

const entityLabels: Record<string, string> = {
  project: "مشروع",
  service: "خدمة",
  dispute: "شكوى",
  ticket: "تذكرة دعم",
  contract: "عقد",
  escrow: "ضمان مالي",
  invoice: "فاتورة",
};

interface AdminNotificationSheetProps {
  notification: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResend: (n: any) => void;
  isResending: boolean;
}

export function AdminNotificationSheet({ notification, open, onOpenChange, onResend, isResending }: AdminNotificationSheetProps) {
  const navigate = useNavigate();
  if (!notification) return null;

  const st = statusMap[notification.delivery_status] || statusMap.delivered;
  const StIcon = st.icon;
  const entityRoute = notification.entity_type && notification.entity_id && entityRoutes[notification.entity_type]
    ? entityRoutes[notification.entity_type](notification.entity_id)
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            تفاصيل الإشعار
          </SheetTitle>
          <SheetDescription>عرض كامل لبيانات الإشعار</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Type */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">نوع الإشعار</p>
            <Badge variant="outline" className="text-sm">{getNotificationLabel(notification.type)}</Badge>
          </div>

          <Separator />

          {/* Delivery status */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">حالة التوصيل</p>
            <Badge variant="outline" className={st.className}>
              <StIcon className="h-3.5 w-3.5 me-1" />{st.label}
            </Badge>
          </div>

          <Separator />

          {/* Read status */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">حالة القراءة</p>
            <div className="flex items-center gap-1.5 text-sm">
              {notification.is_read
                ? <><Eye className="h-4 w-4 text-success" /> <span>مقروء</span></>
                : <><EyeOff className="h-4 w-4 text-muted-foreground" /> <span>غير مقروء</span></>
              }
            </div>
          </div>

          <Separator />

          {/* Recipient */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">المستلِم</p>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <User className="h-4 w-4 text-muted-foreground" />
              {notification.profiles?.full_name || "—"}
            </div>
          </div>

          <Separator />

          {/* Full message */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">نص الرسالة</p>
            <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
              {notification.message}
            </div>
          </div>

          <Separator />

          {/* Related entity */}
          {notification.entity_type && (
            <>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">الكيان المرتبط</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {entityLabels[notification.entity_type] || notification.entity_type}
                  </Badge>
                  {entityRoute && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs text-primary"
                      onClick={() => { onOpenChange(false); navigate(entityRoute); }}
                    >
                      <Link2 className="h-3.5 w-3.5" /> عرض التفاصيل
                    </Button>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Date */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">التاريخ</p>
            <p className="text-sm">
              {format(new Date(notification.created_at), "dd MMMM yyyy — HH:mm", { locale: ar })}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ar })}
            </p>
          </div>

          <Separator />

          {/* Resend action */}
          <Button
            className="w-full gap-2"
            variant="outline"
            onClick={() => onResend(notification)}
            disabled={isResending}
          >
            <RotateCcw className="h-4 w-4" /> إعادة إرسال الإشعار
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
