import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUpdateServiceApproval, useAdminDeleteService } from "@/hooks/useAdminServices";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2, FileEdit } from "lucide-react";
import { EditRequestDialog, type FieldConfig } from "@/components/admin/EditRequestDialog";

const approvalLabels: Record<string, string> = { pending: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض" };
const approvalColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  approved: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-destructive/10 text-destructive",
};

const serviceFields: FieldConfig[] = [
  { key: "title", label: "العنوان" },
  { key: "description", label: "الوصف", type: "textarea" },
  { key: "price", label: "السعر", type: "number" },
];

export function ServiceApprovalCard({ service }: { service: any }) {
  const update = useUpdateServiceApproval();
  const deleteService = useAdminDeleteService();
  const [editOpen, setEditOpen] = useState(false);

  const handleApproval = (approval: "approved" | "rejected") => {
    update.mutate({ id: service.id, approval, providerId: service.provider_id }, {
      onSuccess: () => toast.success(approval === "approved" ? "تمت الموافقة" : "تم الرفض"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  const handleDelete = () => {
    deleteService.mutate(service.id, {
      onSuccess: () => toast.success("تم حذف الخدمة"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  return (
    <>
      <Card className="overflow-hidden">
        {service.image_url && (
          <div className="w-full h-32 overflow-hidden">
            <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
          </div>
        )}
        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-base">{service.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {service.profiles?.full_name ?? "—"} · {service.categories?.name ?? "—"} · {Number(service.price).toLocaleString()} ر.س
            </p>
          </div>
          <Badge className={approvalColors[service.approval]}>{approvalLabels[service.approval]}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => handleApproval("approved")} disabled={update.isPending || service.approval === "approved"}>موافقة</Button>
            <Button size="sm" variant="destructive" onClick={() => handleApproval("rejected")} disabled={update.isPending || service.approval === "rejected"}>رفض</Button>
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              <FileEdit className="h-4 w-4 ml-1" />طلب تعديل
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="mr-auto"><Trash2 className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>حذف الخدمة</AlertDialogTitle>
                  <AlertDialogDescription>هل أنت متأكد من حذف "{service.title}"؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <EditRequestDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        targetTable="micro_services"
        targetId={service.id}
        targetUserId={service.provider_id}
        currentValues={service}
        fields={serviceFields}
        title="طلب تعديل الخدمة"
      />
    </>
  );
}