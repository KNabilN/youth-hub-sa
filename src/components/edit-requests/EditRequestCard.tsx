import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAcceptEditRequest, useRejectEditRequest, type EditRequest } from "@/hooks/useEditRequests";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const targetLabels: Record<string, string> = {
  micro_services: "خدمة",
  projects: "مشروع",
  profiles: "ملف شخصي",
};

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  accepted: "مقبول",
  rejected: "مرفوض",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  accepted: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-destructive/10 text-destructive",
};

const fieldLabels: Record<string, string> = {
  title: "العنوان",
  description: "الوصف",
  price: "السعر",
  budget: "الميزانية",
  full_name: "الاسم",
  phone: "الهاتف",
  organization_name: "اسم المنظمة",
  bio: "نبذة",
  hourly_rate: "السعر بالساعة",
};

export function EditRequestCard({ request }: { request: EditRequest }) {
  const accept = useAcceptEditRequest();
  const reject = useRejectEditRequest();
  const isPending = request.status === "pending";

  const handleAccept = () => {
    accept.mutate(request, {
      onSuccess: () => toast.success("تم قبول التعديل وتطبيقه"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  const handleReject = () => {
    reject.mutate(request, {
      onSuccess: () => toast.success("تم رفض التعديل"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div>
          <CardTitle className="text-base">
            طلب تعديل {targetLabels[request.target_table] || request.target_table}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(request.created_at), "yyyy/MM/dd HH:mm", { locale: ar })}
          </p>
        </div>
        <Badge className={statusColors[request.status]}>
          {statusLabels[request.status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {request.message && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium text-xs text-muted-foreground mb-1">رسالة المدير:</p>
            <p>{request.message}</p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">التغييرات المطلوبة:</p>
          {Object.entries(request.requested_changes).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between bg-accent/30 rounded-md px-3 py-2 text-sm">
              <span className="font-medium">{fieldLabels[key] || key}</span>
              <span className="text-foreground">{String(value)}</span>
            </div>
          ))}
        </div>

        {isPending && (
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleAccept} disabled={accept.isPending}>
              {accept.isPending ? "جارٍ..." : "قبول وتطبيق"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" disabled={reject.isPending}>رفض</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>رفض طلب التعديل</AlertDialogTitle>
                  <AlertDialogDescription>
                    عند الرفض، سيتم تعليق {targetLabels[request.target_table] || "العنصر"} حتى يوافق عليه المدير مرة أخرى. هل أنت متأكد؟
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReject}>رفض</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
