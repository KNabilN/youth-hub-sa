import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUpdateServiceApproval } from "@/hooks/useAdminServices";
import { toast } from "sonner";

const approvalLabels: Record<string, string> = { pending: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض" };
const approvalColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  approved: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-destructive/10 text-destructive",
};

export function ServiceApprovalCard({ service }: { service: any }) {
  const update = useUpdateServiceApproval();

  const handleApproval = (approval: "approved" | "rejected") => {
    update.mutate({ id: service.id, approval }, {
      onSuccess: () => toast.success(approval === "approved" ? "تمت الموافقة" : "تم الرفض"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  return (
    <Card>
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
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleApproval("approved")} disabled={update.isPending || service.approval === "approved"}>موافقة</Button>
          <Button size="sm" variant="destructive" onClick={() => handleApproval("rejected")} disabled={update.isPending || service.approval === "rejected"}>رفض</Button>
        </div>
      </CardContent>
    </Card>
  );
}
