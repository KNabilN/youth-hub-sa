import { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MoyasarPaymentForm } from "@/components/payment/MoyasarPaymentForm";
import { PricingBreakdownDisplay } from "@/components/payment/PricingBreakdownDisplay";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCartItems, useClearCart } from "@/hooks/useCart";
import { usePurchaseService } from "@/hooks/usePurchaseService";
import { useCreateBankTransfer } from "@/hooks/useBankTransfer";
import { useAuth } from "@/hooks/useAuth";
import { useAssociationGrantBalance } from "@/hooks/useAssociationGrants";
import { usePayFromGrants } from "@/hooks/usePayFromGrants";
import { useVerifiedAssociations } from "@/hooks/useVerifiedAssociations";
import { calculatePricing, useCommissionRate } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { StepProgress } from "@/components/ui/step-progress";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { CreditCard, ShieldCheck, ArrowLeft, Loader2, Building2, Upload, Copy, Check, Users, ChevronsUpDown, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const checkoutSteps = [
  { label: "السلة" },
  { label: "المراجعة" },
  { label: "الدفع" },
  { label: "التأكيد" },
];

const BANK_INFO = {
  bank: "مصرف الراجحي",
  accountName: "شركة معين التنموية لحلول الاعمال",
  accountNumber: "161000010006080221187",
};

export default function Checkout() {
  const { user, role } = useAuth();
  const { data: items, isLoading } = useCartItems();
  const purchase = usePurchaseService();
  const bankTransfer = useCreateBankTransfer();
  const clearCart = useClearCart();
  const navigate = useNavigate();
  const { data: associations } = useVerifiedAssociations();
  const { data: grantBalance } = useAssociationGrantBalance();
  const payFromGrants = usePayFromGrants();
  const [processing, setProcessing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"electronic" | "bank_transfer">("electronic");
  const [useGrantBalance, setUseGrantBalance] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedAssociation, setSelectedAssociation] = useState<string>("");
  const [assocOpen, setAssocOpen] = useState(false);
  const [showMoyasarForm, setShowMoyasarForm] = useState(false);
  const [moyasarKey, setMoyasarKey] = useState<string | null>(null);
  const [moyasarCallbackUrl, setMoyasarCallbackUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subtotal = items?.reduce((sum, item) => sum + item.micro_services.price * item.quantity, 0) ?? 0;
  const { data: commissionRate = 0.05 } = useCommissionRate();
  const pricing = calculatePricing(subtotal, commissionRate);
  const availableGrant = grantBalance?.available ?? 0;
  const isAssociation = role === "youth_association";
  const hasGrantBalance = isAssociation && availableGrant > 0;

  // Calculate how much grant covers and remaining amount
  const grantDeduction = useGrantBalance ? Math.min(availableGrant, pricing.total) : 0;
  const remainingAfterGrant = Math.round((pricing.total - grantDeduction) * 100) / 100;
  const grantCoversAll = grantDeduction >= pricing.total;

  const checkoutMetadata = useMemo(() => ({
    type: "checkout",
    user_id: user?.id,
  }), [user?.id]);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(BANK_INFO.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("تم نسخ رقم الحساب");
  };

  const handleCheckout = async () => {
    if (!user || !items?.length) return;
    setConfirmOpen(false);
    setProcessing(true);

    try {
      // Step 1: If using grant balance, consume grants first
      if (useGrantBalance && grantDeduction > 0) {
        for (const item of items) {
          let projectId: string | undefined;

          // Association buying directly — auto-create project + contract
          const assocId = selectedAssociation || user.id;
          const { data: proj, error: projErr } = await supabase
            .from("projects")
            .insert({
              title: item.micro_services.title,
              description: `شراء مباشر من السوق — "${item.micro_services.title}"`,
              association_id: assocId,
              assigned_provider_id: item.micro_services.provider_id,
              status: "in_progress" as any,
              budget: item.micro_services.price * item.quantity,
              is_private: true,
            })
            .select("id")
            .single();
          if (!projErr && proj) {
            projectId = proj.id;
            // Create contract WITHOUT auto-signing
            const contractTerms = `نطاق العمل:\n${item.micro_services.title}\n\nشراء مباشر من السوق — يلتزم مقدم الخدمة بتنفيذ الخدمة وفق الوصف المتفق عليه.`;
            await supabase.from("contracts").insert({
              project_id: proj.id,
              provider_id: item.micro_services.provider_id,
              association_id: assocId,
              terms: contractTerms,
            });

            // Create auto-accepted bid
            await supabase.from("bids").insert({
              project_id: proj.id,
              provider_id: item.micro_services.provider_id,
              price: item.micro_services.price * item.quantity,
              timeline_days: 30,
              cover_letter: "عرض تلقائي — شراء خدمة من السوق",
              status: "accepted" as any,
            });

            // Notify provider
            await supabase.from("notifications").insert({
              user_id: item.micro_services.provider_id,
              message: `تم شراء خدمتك "${item.micro_services.title}" وتعيينك على مشروع جديد — يرجى مراجعة العقد وتوقيعه`,
              type: "service_purchased_assigned",
              entity_id: proj.id,
              entity_type: "project",
            });
          }

          if (grantCoversAll) {
            // Grant covers everything — use payFromGrants for full amount
            const itemBase = item.micro_services.price * item.quantity;
            const itemPricing = calculatePricing(itemBase, commissionRate);
            await payFromGrants.mutateAsync({
              amount: itemBase,
              totalAmount: itemPricing.total,
              payeeId: item.micro_services.provider_id,
              serviceId: item.micro_services.id,
              projectId,
            });
          } else {
            // Hybrid: consume available grant for partial coverage
            const itemBase = item.micro_services.price * item.quantity;
            const itemPricing = calculatePricing(itemBase, commissionRate);
            const itemGrantPortion = Math.min(availableGrant, itemPricing.total);

            if (itemGrantPortion > 0) {
              // Calculate what base amount the grant portion covers proportionally
              const grantBaseAmount = Math.round((itemGrantPortion / itemPricing.total) * itemBase * 100) / 100;
              await payFromGrants.mutateAsync({
                amount: grantBaseAmount,
                totalAmount: itemGrantPortion,
                payeeId: item.micro_services.provider_id,
                serviceId: item.micro_services.id,
                projectId,
              });
            }
          }
        }

        if (grantCoversAll) {
          await clearCart.mutateAsync();
          navigate("/payment-success", { state: { total: pricing.total, count: items.length, method: "grant_balance" } });
          return;
        }
      }

      // Step 2: Pay remaining amount via selected method
      if (!useGrantBalance || !grantCoversAll) {
        const effectiveTotal = useGrantBalance ? remainingAfterGrant : pricing.total;
        const effectiveSubtotal = useGrantBalance
          ? Math.round((remainingAfterGrant / pricing.total) * subtotal * 100) / 100
          : subtotal;

        if (paymentMethod === "electronic") {
          const { data, error } = await supabase.functions.invoke("moyasar-get-config");
          if (error || !data?.publishable_key) {
            toast.error("حدث خطأ أثناء تحميل بوابة الدفع");
            setProcessing(false);
            return;
          }

          const paymentItems = items.map((item) => ({
            service_id: item.micro_services.id,
            provider_id: item.micro_services.provider_id,
            price: item.micro_services.price * item.quantity,
            title: item.micro_services.title,
            hours: item.micro_services.service_type === "hourly" ? item.quantity : undefined,
          }));

          const paymentContext = {
            type: "checkout",
            items: paymentItems,
            beneficiary_id: selectedAssociation || null,
            total: effectiveTotal,
            subtotal: effectiveSubtotal,
            commission: pricing.commission,
            vat: pricing.vat,
            commission_rate: commissionRate,
            grant_deduction: grantDeduction,
            skip_project_creation: useGrantBalance && grantDeduction > 0, // projects already created above
          };

          sessionStorage.setItem("moyasar_payment_context", JSON.stringify(paymentContext));
          const ctxParam = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(paymentContext)))));
          const callbackUrl = `${window.location.origin}/payment-callback?ctx=${ctxParam}`;

          setMoyasarKey(data.publishable_key);
          setMoyasarCallbackUrl(callbackUrl);
          setShowMoyasarForm(true);
          setProcessing(false);
        } else {
          // Bank transfer
          if (!receiptFile) {
            toast.error("يرجى رفع صورة إيصال التحويل");
            setProcessing(false);
            return;
          }
          await bankTransfer.mutateAsync({
            receiptFile,
            amount: effectiveTotal,
            baseAmount: effectiveSubtotal,
            userId: user.id,
            beneficiaryId: selectedAssociation || undefined,
            items: items.map((item) => ({
              serviceId: item.micro_services.id,
              providerId: item.micro_services.provider_id,
              price: item.micro_services.price * item.quantity,
              title: item.micro_services.title,
              hours: item.micro_services.service_type === "hourly" ? item.quantity : undefined,
            })),
          });
          await clearCart.mutateAsync();
          navigate("/payment-success", {
            state: {
              total: pricing.total,
              count: items.length,
              method: "bank_transfer",
              grantDeduction: grantDeduction > 0 ? grantDeduction : undefined,
            },
          });
        }
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء معالجة الدفع. حاول مرة أخرى.");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !items?.length) {
      navigate("/cart");
    }
  }, [isLoading, items, navigate]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!items?.length) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <StepProgress steps={checkoutSteps} currentStep={2} className="mb-2" />

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cart")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">إتمام الشراء</h1>
            <p className="text-sm text-muted-foreground">مراجعة الطلب وتأكيد الدفع</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3 space-y-4">
            {/* Order Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  تفاصيل الطلب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    {item.micro_services.image_url ? (
                      <img
                        src={item.micro_services.image_url}
                        alt={item.micro_services.title}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.micro_services.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.micro_services.profiles?.full_name}
                        {item.micro_services.service_type === "hourly" && (
                          <span className="ms-1">• {item.quantity} ساعة × {item.micro_services.price.toLocaleString()} ر.س</span>
                        )}
                      </p>
                    </div>
                    <span className="font-bold text-sm">
                      {(item.micro_services.price * item.quantity).toLocaleString()} ر.س
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Beneficiary Association Selector — only for donors */}
            {role !== "youth_association" && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  الجمعية المستفيدة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  اختر الجمعية الشبابية التي ستستفيد من هذه الخدمة
                </p>
                <Popover open={assocOpen} onOpenChange={setAssocOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={assocOpen}
                      className={cn("w-full justify-between font-normal", !selectedAssociation && "text-muted-foreground")}
                    >
                      {selectedAssociation
                        ? (associations?.find(a => a.id === selectedAssociation)?.organization_name || associations?.find(a => a.id === selectedAssociation)?.full_name)
                        : "ابحث واختر الجمعية المستفيدة..."}
                      <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="ابحث عن جمعية..." />
                      <CommandList>
                        <CommandEmpty>لم يتم العثور على نتائج</CommandEmpty>
                        <CommandGroup>
                          {associations?.map((a) => (
                            <CommandItem
                              key={a.id}
                              value={a.organization_name || a.full_name || a.id}
                              onSelect={() => {
                                setSelectedAssociation(a.id);
                                setAssocOpen(false);
                              }}
                            >
                              <Check className={cn("me-2 h-4 w-4", selectedAssociation === a.id ? "opacity-100" : "opacity-0")} />
                              {a.organization_name || a.full_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {!selectedAssociation && (
                  <p className="text-xs text-amber-600">
                    يُنصح باختيار جمعية مستفيدة لإنشاء مشروع تلقائي وتتبع التسليم
                  </p>
                )}
              </CardContent>
            </Card>
            )}

            {/* Grant Balance Toggle — only for associations with balance */}
            {hasGrantBalance && (
              <Card className="border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="use-grant"
                      checked={useGrantBalance}
                      onCheckedChange={(v) => setUseGrantBalance(!!v)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="use-grant" className="cursor-pointer flex-1">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-primary" />
                        <span className="font-medium">استخدام رصيد المنح</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        الرصيد المتاح: {availableGrant.toLocaleString()} ر.س
                      </p>
                      {useGrantBalance && (
                        <div className="mt-2 p-2 rounded-md bg-muted/50 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>سيتم خصمه من المنح</span>
                            <span className="font-bold text-primary">−{grantDeduction.toLocaleString()} ر.س</span>
                          </div>
                          {!grantCoversAll && (
                            <div className="flex justify-between text-foreground">
                              <span>المتبقي للدفع</span>
                              <span className="font-bold">{remainingAfterGrant.toLocaleString()} ر.س</span>
                            </div>
                          )}
                          {grantCoversAll && (
                            <p className="text-primary font-medium">✓ رصيد المنح يغطي كامل المبلغ</p>
                          )}
                        </div>
                      )}
                    </Label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Method Selection — hidden if grant covers all */}
            {!(useGrantBalance && grantCoversAll) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">طريقة الدفع {useGrantBalance && remainingAfterGrant > 0 ? `— المتبقي ${remainingAfterGrant.toLocaleString()} ر.س` : ""}</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as "electronic" | "bank_transfer")}
                  className="space-y-3"
                >
                  <div className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === "electronic" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="electronic" id="electronic" />
                    <Label htmlFor="electronic" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">دفع إلكتروني</p>
                        <p className="text-xs text-muted-foreground">يتم الدفع فوراً وحجز المبلغ في الضمان</p>
                      </div>
                    </Label>
                  </div>

                  <div className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === "bank_transfer" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                    <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">تحويل بنكي</p>
                        <p className="text-xs text-muted-foreground">حوّل المبلغ وارفع إيصال التحويل للمراجعة</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
            )}

            {/* Bank Transfer Details */}
            {paymentMethod === "bank_transfer" && !(useGrantBalance && grantCoversAll) && (
              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    بيانات التحويل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">البنك</span>
                      <span className="font-medium">{BANK_INFO.bank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">اسم الحساب</span>
                      <span className="font-medium text-xs">{BANK_INFO.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">رقم الحساب</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs">{BANK_INFO.accountNumber}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyAccount}>
                          {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المبلغ المطلوب تحويله</span>
                      <span className="font-bold text-primary">
                        {(useGrantBalance ? remainingAfterGrant : pricing.total).toLocaleString()} ر.س
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">إيصال التحويل</Label>
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {receiptFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <Check className="h-4 w-4 text-primary" />
                          <span className="text-sm">{receiptFile.name}</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">اضغط لرفع إيصال التحويل</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setReceiptFile(file);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Moyasar Payment Form */}
            {showMoyasarForm && moyasarKey && (
              <MoyasarPaymentForm
                amount={useGrantBalance ? remainingAfterGrant : pricing.total}
                description={`شراء ${items.length} خدمات عبر منصة معين`}
                callbackUrl={moyasarCallbackUrl}
                publishableKey={moyasarKey}
                metadata={checkoutMetadata}
              />
            )}

            {!showMoyasarForm && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>
                    {useGrantBalance && grantCoversAll
                      ? "سيتم خصم المبلغ من رصيد المنح وحجزه في نظام الضمان المالي"
                      : paymentMethod === "electronic"
                      ? "سيتم حجز المبلغ في نظام الضمان المالي حتى إتمام الخدمة"
                      : "سيتم مراجعة إيصال التحويل من الإدارة وحجز المبلغ بعد الموافقة"}
                  </span>
                </div>
              </CardContent>
            </Card>
            )}
          </div>

          {/* Payment Summary */}
          <div className="md:col-span-2">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">ملخص الدفع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">عدد الخدمات</span>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">طريقة الدفع</span>
                    <Badge variant="outline">
                      {useGrantBalance && grantCoversAll
                        ? "رصيد المنح"
                        : useGrantBalance
                        ? `مختلط (منح + ${paymentMethod === "electronic" ? "إلكتروني" : "تحويل"})`
                        : paymentMethod === "electronic" ? "دفع إلكتروني" : "تحويل بنكي"}
                    </Badge>
                  </div>
                </div>
                <PricingBreakdownDisplay pricing={pricing} />

                {useGrantBalance && grantDeduction > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-primary">
                        <span>خصم رصيد المنح</span>
                        <span className="font-bold">−{grantDeduction.toLocaleString()} ر.س</span>
                      </div>
                      {!grantCoversAll && (
                        <div className="flex justify-between font-bold text-lg">
                          <span>المتبقي للدفع</span>
                          <span className="text-primary">{remainingAfterGrant.toLocaleString()} ر.س</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    if (paymentMethod === "bank_transfer" && !receiptFile && !(useGrantBalance && grantCoversAll)) {
                      toast.error("يرجى رفع صورة إيصال التحويل أولاً");
                      return;
                    }
                    setConfirmOpen(true);
                  }}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      جارٍ المعالجة...
                    </>
                  ) : useGrantBalance && grantCoversAll ? (
                    <>
                      <Wallet className="h-4 w-4 me-2" />
                      تأكيد الدفع من المنح — {pricing.total.toLocaleString()} ر.س
                    </>
                  ) : paymentMethod === "electronic" ? (
                    <>
                      <CreditCard className="h-4 w-4 me-2" />
                      تأكيد الدفع — {(useGrantBalance ? remainingAfterGrant : pricing.total).toLocaleString()} ر.س
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 me-2" />
                      إرسال إيصال التحويل
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-muted-foreground text-center">
                  بالنقر على "تأكيد الدفع" فإنك توافق على شروط الاستخدام وسياسة الخصوصية
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={
            useGrantBalance && grantCoversAll
              ? "تأكيد الدفع من رصيد المنح"
              : paymentMethod === "electronic"
              ? "تأكيد عملية الدفع"
              : "تأكيد إرسال إيصال التحويل"
          }
          description={
            useGrantBalance && grantCoversAll
              ? `هل تريد تأكيد دفع ${pricing.total.toLocaleString()} ر.س من رصيد المنح مقابل ${items.length} خدمات؟`
              : useGrantBalance
              ? `سيتم خصم ${grantDeduction.toLocaleString()} ر.س من رصيد المنح ودفع المتبقي ${remainingAfterGrant.toLocaleString()} ر.س ${paymentMethod === "electronic" ? "إلكترونياً" : "عبر تحويل بنكي"}.`
              : paymentMethod === "electronic"
              ? `هل تريد تأكيد دفع ${pricing.total.toLocaleString()} ر.س مقابل ${items.length} خدمات؟ سيتم حجز المبلغ في نظام الضمان.`
              : `هل تريد إرسال إيصال التحويل البنكي بمبلغ ${pricing.total.toLocaleString()} ر.س؟ سيتم مراجعته من الإدارة.`
          }
          confirmLabel={
            useGrantBalance && grantCoversAll
              ? "تأكيد الدفع"
              : paymentMethod === "electronic"
              ? "تأكيد الدفع"
              : "إرسال الإيصال"
          }
          cancelLabel="مراجعة الطلب"
          loading={processing}
          onConfirm={handleCheckout}
        />
      </div>
    </DashboardLayout>
  );
}
