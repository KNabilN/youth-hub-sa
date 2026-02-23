import { DashboardLayout } from "@/components/DashboardLayout";
import { useDonorContributions, useCreateContribution } from "@/hooks/useDonorContributions";
import { DonationForm } from "@/components/donor/DonationForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Donations() {
  const { data: contributions, isLoading } = useDonorContributions();
  const createContribution = useCreateContribution();

  const handleSubmit = async (values: { amount: number; project_id?: string; service_id?: string }) => {
    try {
      await createContribution.mutateAsync(values);
      toast.success("تم التبرع بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء التبرع");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">التبرعات</h1>
          <p className="text-muted-foreground text-sm mt-1">قدم تبرعاً وتابع سجل تبرعاتك</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">تبرع جديد</CardTitle></CardHeader>
          <CardContent>
            <DonationForm onSubmit={handleSubmit} isLoading={createContribution.isPending} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">سجل التبرعات</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">جاري التحميل...</p>
            ) : !contributions?.length ? (
              <p className="text-muted-foreground text-sm">لا توجد تبرعات سابقة</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>المشروع / الخدمة</TableHead>
                    <TableHead>المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{format(new Date(c.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                      <TableCell>{(c.projects as any)?.title || (c.micro_services as any)?.title || "-"}</TableCell>
                      <TableCell>{Number(c.amount).toLocaleString()} ر.س</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
