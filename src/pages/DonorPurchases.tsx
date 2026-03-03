import { DashboardLayout } from "@/components/DashboardLayout";
import { useDonorPurchases } from "@/hooks/useDonorPurchases";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ShoppingBag } from "lucide-react";

const escrowStatusLabel: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  held: { label: "محتجز", variant: "default" },
  released: { label: "محرر", variant: "secondary" },
  pending_payment: { label: "بانتظار الدفع", variant: "outline" },
  frozen: { label: "مجمد", variant: "destructive" },
  refunded: { label: "مسترد", variant: "destructive" },
  failed: { label: "فشل", variant: "destructive" },
  under_review: { label: "قيد المراجعة", variant: "outline" },
};

const projectStatusLabel: Record<string, string> = {
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغى",
  disputed: "متنازع",
  draft: "مسودة",
  open: "مفتوح",
  pending_approval: "بانتظار الموافقة",
};

export default function DonorPurchases() {
  const { data: purchases, isLoading } = useDonorPurchases();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <ShoppingBag className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">مشترياتي</h1>
            <p className="text-sm text-muted-foreground">تتبع حالة الخدمات التي اشتريتها للجمعيات</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">سجل المشتريات</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !purchases?.length ? (
              <EmptyState
                icon={ShoppingBag}
                title="لا توجد مشتريات"
                description="عند شراء خدمة من سوق الخدمات وتخصيصها لجمعية، ستظهر هنا"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الخدمة</TableHead>
                      <TableHead>مقدم الخدمة</TableHead>
                      <TableHead>الجمعية المستفيدة</TableHead>
                      <TableHead>حالة المشروع</TableHead>
                      <TableHead>الضمان المالي</TableHead>
                      <TableHead>المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((p: any) => {
                      const escrowSt = escrowStatusLabel[p.status] ?? escrowStatusLabel.held;
                      const projectStatus = p.projects?.status;
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="text-sm">
                            {format(new Date(p.created_at), "yyyy/MM/dd", { locale: ar })}
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {p.micro_services?.title || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {p.micro_services?.profiles?.full_name || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {p.projects?.profiles?.organization_name || p.projects?.profiles?.full_name || "-"}
                          </TableCell>
                          <TableCell>
                            {projectStatus ? (
                              <Badge variant="outline" className="text-[10px]">
                                {projectStatusLabel[projectStatus] || projectStatus}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={escrowSt.variant} className="text-[10px]">
                              {escrowSt.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-sm">
                            {Number(p.amount).toLocaleString()} ر.س
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
