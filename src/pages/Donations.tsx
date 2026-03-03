import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDonorContributions, useCreateContribution } from "@/hooks/useDonorContributions";
import { useDonorBalances } from "@/hooks/useDonorStats";
import { usePurchaseService } from "@/hooks/usePurchaseService";
import { useCreateBankTransfer } from "@/hooks/useBankTransfer";
import { useAuth } from "@/hooks/useAuth";
import { DonationForm, DonationFormData } from "@/components/donor/DonationForm";
import { DonationPaymentStep } from "@/components/donor/DonationPaymentStep";
import { DonorBalanceCards } from "@/components/donor/DonorBalanceCards";
import { DonationTimeline } from "@/components/donor/DonationTimeline";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StepProgress } from "@/components/ui/step-progress";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { HandCoins } from "lucide-react";
import { useNavigate } from "react-router-dom";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  available: { label: "متاح", variant: "default" },
  reserved: { label: "محجوز", variant: "secondary" },
  consumed: { label: "مستهلك", variant: "outline" },
  suspended: { label: "معلق", variant: "destructive" },
  expired: { label: "منتهي", variant: "secondary" },
  pending: { label: "بانتظار المراجعة", variant: "secondary" },
};

const donationSteps = [
  { label: "بيانات المنحة" },
  { label: "الدفع" },
  { label: "التأكيد" },
];

export default function Donations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: contributions, isLoading } = useDonorContributions();
  const { data: balances, isLoading: balancesLoading } = useDonorBalances();
  const createContribution = useCreateContribution();
  const purchase = usePurchaseService();
  const bankTransfer = useCreateBankTransfer();

  const [step, setStep] = useState<"form" | "payment">("form");
  const [formData, setFormData] = useState<DonationFormData | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFormSubmit = (data: DonationFormData) => {
    setFormData(data);
    setStep("payment");
  };

  const handlePaymentConfirm = async (method: "electronic" | "bank_transfer", receiptFile?: File) => {
    if (!user || !formData) return;
    setProcessing(true);
    try {
      if (method === "electronic") {
        if (formData.target_type === "service" && formData.provider_id) {
          await purchase.mutateAsync({
            serviceId: formData.target_id,
            providerId: formData.provider_id,
            buyerId: user.id,
            amount: formData.amount,
            serviceTitle: formData.target_title,
          });
        } else {
          // For projects, create escrow + contribution directly
          const { data: escrow, error: escrowErr } = await (await import("@/integrations/supabase/client")).supabase
            .from("escrow_transactions")
            .insert({
              payer_id: user.id,
              payee_id: user.id, // placeholder, admin will manage
              amount: formData.amount,
              status: "held" as any,
              project_id: formData.target_id,
            } as any)
            .select()
            .single();
          if (escrowErr) throw escrowErr;

          await createContribution.mutateAsync({
            amount: formData.amount,
            project_id: formData.target_id,
            donation_status: "available",
          });
        }
        navigate("/payment-success", { state: { total: formData.amount, count: 1, method: "electronic" } });
      } else {
        // Bank transfer
        if (!receiptFile) return;
        if (formData.target_type === "service" && formData.provider_id) {
          await bankTransfer.mutateAsync({
            receiptFile,
            amount: formData.amount,
            userId: user.id,
            items: [{
              serviceId: formData.target_id,
              providerId: formData.provider_id,
              price: formData.amount,
              title: formData.target_title,
            }],
          });
        } else {
          // For project bank transfer
          const { supabase } = await import("@/integrations/supabase/client");
          const filePath = `${user.id}/${Date.now()}_${receiptFile.name}`;
          const { error: uploadErr } = await supabase.storage.from("transfer-receipts").upload(filePath, receiptFile);
          if (uploadErr) throw uploadErr;

          const { data: escrow, error: escrowErr } = await supabase
            .from("escrow_transactions")
            .insert({
              payer_id: user.id,
              payee_id: user.id,
              amount: formData.amount,
              status: "pending_payment" as any,
              project_id: formData.target_id,
            } as any)
            .select()
            .single();
          if (escrowErr) throw escrowErr;

          await supabase.from("bank_transfers").insert({
            escrow_id: escrow.id,
            user_id: user.id,
            receipt_url: filePath,
            amount: formData.amount,
          } as any);

          await createContribution.mutateAsync({
            amount: formData.amount,
            project_id: formData.target_id,
            donation_status: "pending",
          });
        }
        navigate("/payment-success", { state: { total: formData.amount, count: 1, method: "bank_transfer" } });
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء معالجة الدفع. حاول مرة أخرى.");
    } finally {
      setProcessing(false);
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
            <h1 className="text-2xl font-bold">المنح</h1>
            <p className="text-sm text-muted-foreground">قدم منحة وتابع سجل منحك وأرصدتك</p>
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
          <CardHeader>
            <CardTitle className="text-lg">منحة جديدة</CardTitle>
            <StepProgress steps={donationSteps} currentStep={step === "form" ? 0 : 1} className="mt-2" />
          </CardHeader>
          <CardContent>
            {step === "form" ? (
              <DonationForm onSubmit={handleFormSubmit} />
            ) : formData ? (
              <DonationPaymentStep
                amount={formData.amount}
                targetLabel={formData.target_title}
                onConfirm={handlePaymentConfirm}
                onBack={() => setStep("form")}
                isProcessing={processing}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">سجل المنح</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !contributions?.length ? (
              <EmptyState icon={HandCoins} title="لا توجد منح سابقة" description="قدّم منحتك الأولى من النموذج أعلاه" />
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
                        <TableHead>الطلب / الخدمة</TableHead>
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
