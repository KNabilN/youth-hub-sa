import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUpdateServiceApproval, useAdminDeleteService, useAdminUpdateService } from "@/hooks/useAdminServices";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, FileEdit, Pause, Play, History } from "lucide-react";
import { AdminDirectEditDialog, type DirectEditFieldConfig } from "@/components/admin/AdminDirectEditDialog";
import { EntityActivityLog } from "@/components/admin/EntityActivityLog";
import { logAudit } from "@/lib/audit";

const approvalLabels: Record<string, string> = {
  draft: "مسودة", pending: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض",
  suspended: "موقوف مؤقتاً", archived: "مؤرشف",
};
const approvalColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-500/10 text-yellow-600",
  approved: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-destructive/10 text-destructive",
  suspended: "bg-orange-500/10 text-orange-600",
  archived: "bg-muted text-muted-foreground",
};

const serviceFields: DirectEditFieldConfig[] = [
  { key: "title", label: "العنوان" },
  { key: "description", label: "الوصف", type: "textarea" },
  { key: "price", label: "السعر", type: "number" },
  { key: "category_id", label: "التصنيف", type: "select", selectSource: "categories" },
  { key: "region_id", label: "المنطقة", type: "select", selectSource: "regions" },
];

export function ServiceApprovalCard({ service }: { service: any }) {
  const update = useUpdateServiceApproval();
  const deleteService = useAdminDeleteService();
  const updateService = useAdminUpdateService();
  const [editOpen, setEditOpen] = useState(false);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [reasonAction, setReasonAction] = useState<"suspended" | "approved" | null>(null);
  const [reason, setReason] = useState("");
  const [activityOpen, setActivityOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApproval = (approval: "approved" | "rejected") => {
    if (approval === "rejected") {
      setRejectionReason("");
      setRejectDialogOpen(true);
      return;
    }
    update.mutate({ id: service.id, approval, providerId: service.provider_id }, {
      onSuccess: () => toast.success("تمت الموافقة"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض");
      return;
    }
    update.mutate({ id: service.id, approval: "rejected", providerId: service.provider_id, rejection_reason: rejectionReason.trim() }, {
      onSuccess: () => {
        toast.success("تم رفض الخدمة");
        setRejectDialogOpen(false);
      },
      onError: () => toast.error("حدث خطأ"),
    });
  };

  const openReasonDialog = (action: "suspended" | "approved") => {
    setReasonAction(action);
    setReason("");
    setReasonDialogOpen(true);
  };

  const handleReasonConfirm = () => {
    if (!reason.trim()) {
      toast.error("يرجى إدخال السبب");
      return;
    }
    if (!reasonAction) return;
    const actionLabel = reasonAction === "suspended" ? "تعليق" : "إعادة تفعيل";
    update.mutate({ id: service.id, approval: reasonAction, providerId: service.provider_id }, {
      onSuccess: async () => {
        await logAudit("micro_services", service.id, reasonAction === "suspended" ? "suspend" : "reactivate", 
          { approval: service.approval }, 
          { approval: reasonAction, reason: reason.trim() }
        );
        toast.success(`تم ${actionLabel} الخدمة`);
        setReasonDialogOpen(false);
      },
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
              {service.profiles?.organization_name || service.profiles?.full_name || "—"} · {service.categories?.name ?? "—"} · {Number(service.price).toLocaleString()} ر.س
            </p>
          </div>
          <Badge className={approvalColors[service.approval]}>{approvalLabels[service.approval]}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
          {service.approval === "rejected" && service.rejection_reason && (
            <div className="text-xs text-destructive bg-destructive/5 rounded-md p-2 border border-destructive/20 mb-3">
              <span className="font-semibold">سبب الرفض:</span> {service.rejection_reason}
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {service.approval === "pending" && (
              <>
                <Button size="sm" onClick={() => handleApproval("approved")} disabled={update.isPending}>موافقة</Button>
                <Button size="sm" variant="destructive" onClick={() => handleApproval("rejected")} disabled={update.isPending}>رفض</Button>
              </>
            )}
            {service.approval === "approved" && (
              <Button size="sm" variant="outline" className="text-orange-600" onClick={() => openReasonDialog("suspended")} disabled={update.isPending}>
                <Pause className="h-4 w-4 me-1" />تعليق
              </Button>
            )}
            {service.approval === "suspended" && (
              <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => openReasonDialog("approved")} disabled={update.isPending}>
                <Play className="h-4 w-4 me-1" />إعادة تفعيل
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setActivityOpen(true)}>
              <History className="h-4 w-4 me-1" />السجل
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
              <FileEdit className="h-4 w-4 me-1" />طلب تعديل
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="me-auto"><Trash2 className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>حذف الخدمة</AlertDialogTitle>
                  <AlertDialogDescription>سيتم نقل "{service.title}" إلى سلة المحذوفات لمدة 30 يوماً.</AlertDialogDescription>
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

      <AdminDirectEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        currentValues={service}
        fields={serviceFields}
        title="تعديل الخدمة"
        isPending={updateService.isPending}
        onSave={async (updates) => {
          await updateService.mutateAsync({ id: service.id, ...updates });
        }}
      />

      {/* Reason Dialog for suspend/reactivate */}
      <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{reasonAction === "suspended" ? "تعليق الخدمة" : "إعادة تفعيل الخدمة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {reasonAction === "suspended"
                ? `سيتم تعليق خدمة "${service.title}" مؤقتاً.`
                : `سيتم إعادة تفعيل خدمة "${service.title}".`}
            </p>
            <div>
              <Label>السبب *</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="اكتب السبب..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReasonDialogOpen(false)}>إلغاء</Button>
            <Button variant={reasonAction === "suspended" ? "destructive" : "default"} onClick={handleReasonConfirm} disabled={update.isPending}>
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Log Dialog */}
      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>سجل نشاط الخدمة</DialogTitle>
          </DialogHeader>
          <EntityActivityLog tableName="micro_services" recordId={service.id} maxHeight="400px" />
        </DialogContent>
      </Dialog>
    </>
  );
}