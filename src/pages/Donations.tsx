import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDonorContributions, useCreateContribution, useDonorConsumedBreakdown } from "@/hooks/useDonorContributions";
import { useDonorBalances } from "@/hooks/useDonorStats";
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
import { HandCoins, FolderKanban, Layers, Building2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MoyasarPaymentForm } from "@/components/payment/MoyasarPaymentForm";
import { calculatePricing, useCommissionRate } from "@/lib/pricing";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  available: { label: "متاح", variant: "default" },
  reserved: { label: "محجوز", variant: "secondary" },
  consumed: { label: "مستهلك", variant: "outline" },
  suspended: { label: "معلق", variant: "destructive" },
  expired: { label: "منتهي", variant: "secondary" },
  pending: { label: "بانتظار المراجعة", variant: "secondary" },
  rejected: { label: "مرفوض", variant: "destructive" },
};

const donationSteps = [{ label: "بيانات المنحة" }, { label: "الدفع" }, { label: "التأكيد" }];

function ConsumedBreakdown() {
  const { data: consumed, isLoading } = useDonorConsumedBreakdown();

  if (isLoading)
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  if (!consumed?.length)
    return (
      <EmptyState
        icon={HandCoins}
        title="لا توجد منح مستهلكة بعد"
        description="سيظهر هنا تفصيل استخدام منحك عند استهلاكها من قبل الجمعيات"
      />
    );

  // Group by association
  const grouped = consumed.reduce(
    (acc: Record<string, { name: string; total: number; items: typeof consumed }>, c: any) => {
      const assocId = c.association_id || "unknown";
      const assocName = c.profiles?.organization_name || c.profiles?.full_name || "غير محدد";
      if (!acc[assocId]) acc[assocId] = { name: assocName, total: 0, items: [] };
      acc[assocId].total += Number(c.amount);
      acc[assocId].items.push(c);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([assocId, group]: [string, any]) => (
        <Card key={assocId} className="border-s-4 border-s-primary/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">{group.name}</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs font-bold">
                {group.total.toLocaleString()} ر.س
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">التاريخ</TableHead>
                  <TableHead className="text-xs">النوع</TableHead>
                  <TableHead className="text-xs">الطلب / الخدمة</TableHead>
                  <TableHead className="text-xs">مزود الخدمة</TableHead>
                  <TableHead className="text-xs">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.items.map((item: any) => {
                  const hasProject = !!item.project_id && item.projects?.title;
                  const hasService = !!item.service_id && item.micro_services?.title;
                  const targetLabel = hasProject
                    ? item.projects.title
                    : hasService
                      ? item.micro_services.title
                      : "دعم عام";
                  const targetRef = hasProject
                    ? item.projects.request_number
                    : hasService
                      ? item.micro_services.service_number
                      : null;
                  const Icon = hasProject ? FolderKanban : hasService ? Layers : HandCoins;
                  const typeLabel = hasProject ? "طلب مشروع" : hasService ? "خدمة" : "دعم عام";

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs">
                        {format(new Date(item.created_at), "yyyy/MM/dd", { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={hasProject ? "default" : hasService ? "secondary" : "outline"}
                          className="text-[10px]"
                        >
                          {typeLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div>
                            <span className="font-medium">{targetLabel}</span>
                            {targetRef && <span className="text-muted-foreground mr-1 text-[10px]">({targetRef})</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.provider_name ? (
                          <span className="text-foreground">{item.provider_name}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{Number(item.amount).toLocaleString()} ر.س</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Donations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: contributions, isLoading } = useDonorContributions();
  const { data: balances, isLoading: balancesLoading } = useDonorBalances();
  const createContribution = useCreateContribution();

  // Read URL params for auto-fill from grant requests
  const urlAssociationId = searchParams.get("association_id") || undefined;
  const urlAmount = searchParams.get("amount") ? Number(searchParams.get("amount")) : undefined;
  const urlProjectId = searchParams.get("project_id") || undefined;
  const urlGrantRequestId = searchParams.get("grant_request_id") || undefined;

  const [step, setStep] = useState<"form" | "payment" | "moyasar">("form");
  const [formData, setFormData] = useState<DonationFormData | null>(null);
  const [processing, setProcessing] = useState(false);
  const [moyasarKey, setMoyasarKey] = useState<string | null>(null);
  const [moyasarCallbackUrl, setMoyasarCallbackUrl] = useState<string>("");
  const { data: commissionRate = 0.05 } = useCommissionRate();

  const donationMetadata = useMemo(
    () => ({
      type: "donation",
      user_id: user?.id,
    }),
    [user?.id],
  );

  const handleFormSubmit = (data: DonationFormData) => {
    setFormData(data);
    setStep("payment");
  };

  const handlePaymentConfirm = async (receiptFile: File) => {
    if (!user || !formData || processing) return;
    setProcessing(true);
    const donationPricing = calculatePricing(formData.amount, commissionRate);
    try {
      // 1. Upload receipt
      const filePath = `${user.id}/${Date.now()}_${receiptFile.name}`;
      const { error: uploadErr } = await supabase.storage.from("transfer-receipts").upload(filePath, receiptFile);
      if (uploadErr) throw uploadErr;

      if (formData.target_type === "association") {
        const { data: escrow, error: escrowErr } = await supabase
          .from("escrow_transactions")
          .insert({
            payer_id: user.id,
            payee_id: formData.association_id,
            beneficiary_id: formData.association_id,
            amount: formData.amount,
            status: "pending_payment" as any,
            grant_request_id: urlGrantRequestId || null,
          } as any)
          .select()
          .single();
        if (escrowErr) throw escrowErr;

        await supabase.from("bank_transfers").insert({
          escrow_id: escrow.id,
          user_id: user.id,
          receipt_url: filePath,
          amount: donationPricing.total,
        } as any);

        await createContribution.mutateAsync({
          amount: formData.amount,
          association_id: formData.association_id,
          donation_status: "pending",
        });
      } else {
        const projectId = formData.project_id!;
        const { data: project } = await supabase
          .from("projects")
          .select("assigned_provider_id, association_id")
          .eq("id", projectId)
          .single();

        const payeeId = project?.assigned_provider_id || formData.association_id;

        const { data: escrow, error: escrowErr } = await supabase
          .from("escrow_transactions")
          .insert({
            payer_id: user.id,
            payee_id: payeeId,
            beneficiary_id: formData.association_id,
            amount: formData.amount,
            status: "pending_payment" as any,
            project_id: projectId,
            grant_request_id: urlGrantRequestId || null,
          } as any)
          .select()
          .single();
        if (escrowErr) throw escrowErr;

        await supabase.from("bank_transfers").insert({
          escrow_id: escrow.id,
          user_id: user.id,
          receipt_url: filePath,
          amount: donationPricing.total,
        } as any);

        await createContribution.mutateAsync({
          amount: formData.amount,
          project_id: projectId,
          association_id: formData.association_id,
          donation_status: "pending",
        });
      }

      navigate("/payment-success", { state: { total: donationPricing.total, count: 1, method: "bank_transfer" } });
    } catch (err) {
      toast.error("حدث خطأ أثناء معالجة الدفع. حاول مرة أخرى.");
    } finally {
      setProcessing(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (!user || !formData || processing) return;
    setProcessing(true);
    const donationPricing = calculatePricing(formData.amount, commissionRate);
    try {
      const { data, error } = await supabase.functions.invoke("moyasar-get-config");
      if (error || !data?.publishable_key) {
        toast.error("حدث خطأ أثناء تحميل بوابة الدفع");
        setProcessing(false);
        return;
      }

      // Save context for callback verification
      const paymentContext = {
        type: "donation",
        target_type: formData.target_type,
        association_id: formData.association_id,
        project_id: formData.project_id || null,
        grant_request_id: urlGrantRequestId || null,
        total: donationPricing.total,
        subtotal: formData.amount,
      };
      sessionStorage.setItem("moyasar_payment_context", JSON.stringify(paymentContext));
      const ctxParam = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(paymentContext)))));
      const callbackUrl = `${window.location.origin}/payment-callback?ctx=${ctxParam}`;

      setMoyasarKey(data.publishable_key);
      setMoyasarCallbackUrl(callbackUrl);
      setStep("moyasar");
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
            <StepProgress
              steps={donationSteps}
              currentStep={step === "form" ? 0 : step === "payment" || step === "moyasar" ? 1 : 2}
              className="mt-2"
            />
          </CardHeader>
          <CardContent>
            {step === "form" ? (
              <DonationForm
                onSubmit={handleFormSubmit}
                defaultAssociationId={urlAssociationId}
                defaultAmount={urlAmount}
                defaultProjectId={urlProjectId}
                defaultTargetType={urlProjectId ? "project" : undefined}
              />
            ) : step === "moyasar" &&
              formData &&
              moyasarKey &&
              moyasarCallbackUrl &&
              calculatePricing(formData.amount, commissionRate).total > 0 ? (
              <MoyasarPaymentForm
                // ✅ Multiply by 100 to convert Riyals to Halalas
                amount={calculatePricing(formData.amount, commissionRate).total}
                description={
                  formData.target_type === "association"
                    ? `منحة لجمعية ${formData.association_name}`
                    : `منحة لطلب ${formData.project_title}`
                }
                callbackUrl={moyasarCallbackUrl}
                publishableKey={moyasarKey}
                metadata={donationMetadata}
              />
            ) : formData ? (
              <DonationPaymentStep
                amount={formData.amount}
                targetType={formData.target_type}
                associationName={formData.association_name}
                projectTitle={formData.project_title}
                onConfirm={handlePaymentConfirm}
                onOnlinePayment={handleOnlinePayment}
                onBack={() => setStep("form")}
                isProcessing={processing}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">سجل المنح</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !contributions?.length ? (
              <EmptyState icon={HandCoins} title="لا توجد منح سابقة" description="قدّم منحتك الأولى من النموذج أعلاه" />
            ) : (
              <DonationsLog contributions={contributions} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function DonationsLog({ contributions }: { contributions: any[] }) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return contributions;
    return contributions.filter((c: any) => c.donation_status === statusFilter);
  }, [contributions, statusFilter]);

  return (
    <Tabs defaultValue="timeline" dir="rtl">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <TabsList>
          <TabsTrigger value="timeline">السجل الزمني</TabsTrigger>
          <TabsTrigger value="table">جدول</TabsTrigger>
          <TabsTrigger value="consumed">استخدام المنح</TabsTrigger>
        </TabsList>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="فلتر الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="available">متاح</SelectItem>
            <SelectItem value="reserved">محجوز</SelectItem>
            <SelectItem value="consumed">مستهلك</SelectItem>
            <SelectItem value="suspended">معلق</SelectItem>
            <SelectItem value="pending">بانتظار المراجعة</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <TabsContent value="timeline">
        <DonationTimeline contributions={filtered as any} />
      </TabsContent>
      <TabsContent value="table">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>الوجهة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>المبلغ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c: any) => {
                const st = statusConfig[c.donation_status] ?? statusConfig.available;
                const target =
                  c.projects?.title ||
                  (c.profiles as any)?.organization_name ||
                  (c.profiles as any)?.full_name ||
                  "منحة عامة";
                return (
                  <TableRow key={c.id}>
                    <TableCell>{format(new Date(c.created_at), "yyyy/MM/dd", { locale: ar })}</TableCell>
                    <TableCell>{target}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant} className="text-[10px]">
                        {st.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{Number(c.amount).toLocaleString()} ر.س</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      <TabsContent value="consumed">
        <ConsumedBreakdown />
      </TabsContent>
    </Tabs>
  );
}
