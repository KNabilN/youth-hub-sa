import { DashboardLayout } from "@/components/DashboardLayout";
import { useDonorContributions, useCreateContribution } from "@/hooks/useDonorContributions";
import { useDonorBalances } from "@/hooks/useDonorStats";
import { DonationForm } from "@/components/donor/DonationForm";
import { DonorBalanceCards } from "@/components/donor/DonorBalanceCards";
import { DonationTimeline } from "@/components/donor/DonationTimeline";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { HandCoins } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  available: { label: "متاح", variant: "default" },
  reserved: { label: "محجوز", variant: "secondary" },
  consumed: { label: "مستهلك", variant: "outline" },
  suspended: { label: "معلق", variant: "destructive" },
  expired: { label: "منتهي", variant: "secondary" },
};

export default function Donations() {
  const { data: contributions, isLoading } = useDonorContributions();
  const { data: balances, isLoading: balancesLoading } = useDonorBalances();
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
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <HandCoins className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">التبرعات</h1>
            <p className="text-sm text-muted-foreground">قدم تبرعاً وتابع سجل تبرعاتك وأرصدتك</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {/* Balance Cards */}
        <DonorBalanceCards
          available={balances?.available ?? 0}
          reserved={balances?.reserved ?? 0}
          consumed={balances?.consumed ?? 0}
          suspended={balances?.suspended ?? 0}
          expired={balances?.expired ?? 0}
          isLoading={balancesLoading}
        />

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
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !contributions?.length ? (
              <EmptyState icon={HandCoins} title="لا توجد تبرعات سابقة" description="قدّم تبرعك الأول من النموذج أعلاه" />
            ) : (
              <Tabs defaultValue="timeline" dir="rtl">
                <TabsList className="mb-4">
                  <TabsTrigger value="timeline">السجل الزمني</TabsTrigger>
                  <TabsTrigger value="table">جدول</TabsTrigger>
                </TabsList>
                <TabsContent value="timeline">
                  <DonationTimeline contributions={contributions as any} />
                </TabsContent>
                <TabsContent value="table">
                  <div className="overflow-x-auto"><Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>المشروع / الخدمة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>المبلغ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contributions.map((c: any) => {
                        const st = statusConfig[c.donation_status] ?? statusConfig.available;
                        return (
                          <TableRow key={c.id}>
                            <TableCell>{format(new Date(c.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                            <TableCell>{c.projects?.title || c.micro_services?.title || "-"}</TableCell>
                            <TableCell><Badge variant={st.variant} className="text-[10px]">{st.label}</Badge></TableCell>
                            <TableCell>{Number(c.amount).toLocaleString()} ر.س</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table></div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
