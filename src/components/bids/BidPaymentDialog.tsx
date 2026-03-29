import { useState, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StepProgress } from "@/components/ui/step-progress";
import { PricingBreakdownDisplay } from "@/components/payment/PricingBreakdownDisplay";
import { MoyasarPaymentForm } from "@/components/payment/MoyasarPaymentForm";
import { calculatePricing, useCommissionRate } from "@/lib/pricing";
import { useAcceptBid } from "@/hooks/useBids";
import { useCreateBankTransfer } from "@/hooks/useBankTransfer";
import { useAuth } from "@/hooks/useAuth";
import { useProjectGrantBalance } from "@/hooks/useAssociationGrants";
import { usePayFromGrants } from "@/hooks/usePayFromGrants";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Building2, Shield, Check, Copy, Upload, Wallet, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const BANK_INFO = {
  bank: "مصرف الراجحي",
  accountName: "شركة معين التنموية لحلول الاعمال",
  accountNumber: "161000010006080221187",
};

interface BidPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bid: {
    id: string;
    price: number;
    provider_id: string;
    profiles?: { full_name: string } | null;
  };
  projectId: string;
  projectTitle: string;
  skipAcceptBid?: boolean;
}

type PaymentMethod = "electronic" | "bank_transfer" | "grant_balance" | "mixed_grant";

export function BidPaymentDialog({ open, onOpenChange, bid, projectId, projectTitle, skipAcceptBid = false }: BidPaymentDialogProps) {
  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("electronic");
  const [mixedRemainingMethod, setMixedRemainingMethod] = useState<"electronic" | "bank_transfer">("electronic");
  const [moyasarKey, setMoyasarKey] = useState<string | null>(null);
  const [moyasarCallbackUrl, setMoyasarCallbackUrl] = useState("");
  const [showMoyasarForm, setShowMoyasarForm] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, role } = useAuth();
  const { data: commissionRate = 0.05 } = useCommissionRate();
  const acceptBid = useAcceptBid();
  const bankTransfer = useCreateBankTransfer();
  const { data: grantBalance } = useProjectGrantBalance(projectId);
  const payFromGrants = usePayFromGrants();

  const pricing = useMemo(() => calculatePricing(bid.price, commissionRate), [bid.price, commissionRate]);

  const isAssociation = role === "youth_association";
  const totalGrantAvailable = grantBalance?.total ?? 0;
  const hasFullGrantBalance = isAssociation && totalGrantAvailable >= pricing.total;
  const hasPartialGrantBalance = isAssociation && totalGrantAvailable > 0 && totalGrantAvailable < pricing.total;
  const remainingAfterGrants = Math.max(0, pricing.total - totalGrantAvailable);
  const grantPortionForMixed = Math.min(totalGrantAvailable, pricing.total);
  const grantCoveragePercent = pricing.total > 0 ? Math.min(100, Math.round((totalGrantAvailable / pricing.total) * 100)) : 0;

  const moyasarMetadata = useMemo(() => ({
    type: "project_payment",
    user_id: user?.id,
    project_id: projectId,
  }), [user?.id, projectId]);

  const steps = [
    { label: "مراجعة التكلفة" },
    { label: "الدفع" },
  ];

  const handleAcceptAndPay = async () => {
    if (!user || loadingPayment) return;
    setLoadingPayment(true);
    try {
      if (!skipAcceptBid) {
        await acceptBid.mutateAsync({ bidId: bid.id, projectId, providerId: bid.provider_id, bidPrice: bid.price });
      }

      if (paymentMethod === "electronic") {
        const { data, error } = await supabase.functions.invoke("moyasar-get-config");
        if (error || !data?.publishable_key) {
          toast({ title: "حدث خطأ أثناء تحميل بوابة الدفع", variant: "destructive" });
          return;
        }
        const paymentContext = {
          type: "project_payment",
          project_id: projectId,
          provider_id: bid.provider_id,
          association_id: user.id,
          subtotal: bid.price,
          total: pricing.total,
          commission: pricing.commission,
          vat: pricing.vat,
          commission_rate: commissionRate,
        };
        sessionStorage.setItem("moyasar_payment_context", JSON.stringify(paymentContext));
        const ctxParam = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(paymentContext)))));
        const callbackUrl = `${window.location.origin}/payment-callback?ctx=${ctxParam}`;
        setMoyasarKey(data.publishable_key);
        setMoyasarCallbackUrl(callbackUrl);
        setShowMoyasarForm(true);
        setStep(1);
      }
    } catch {
      toast({ title: "حدث خطأ أثناء قبول العرض", variant: "destructive" });
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleBankTransfer = async () => {
    if (!receiptFile || !user || loadingPayment) return;
    setLoadingPayment(true);
    try {
      if (!skipAcceptBid) {
        await acceptBid.mutateAsync({ bidId: bid.id, projectId, providerId: bid.provider_id, bidPrice: bid.price });
      }

      await bankTransfer.mutateAsync({
        receiptFile,
        amount: pricing.total,
        baseAmount: bid.price,
        userId: user.id,
        items: [{
          serviceId: projectId,
          providerId: bid.provider_id,
          price: bid.price,
          title: projectTitle,
        }],
      });
      toast({ title: "تم قبول العرض ورفع إيصال التحويل", description: "سيتم مراجعته من الإدارة وبعد الموافقة يبدأ العمل" });
      onOpenChange(false);
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleGrantPayment = async () => {
    if (!user || loadingPayment) return;
    setLoadingPayment(true);
    try {
      if (!skipAcceptBid) {
        await acceptBid.mutateAsync({ bidId: bid.id, projectId, providerId: bid.provider_id, bidPrice: bid.price });
      }
      await payFromGrants.mutateAsync({
        amount: bid.price,
        totalAmount: pricing.total,
        payeeId: bid.provider_id,
        projectId,
      });

      const now = new Date().toISOString();
      const contractTerms = `نطاق العمل:\n${projectTitle}\n\nيلتزم مقدم الخدمة بتنفيذ العمل وفق الوصف المتفق عليه.`;
      await supabase.from("contracts").insert({
        project_id: projectId,
        provider_id: bid.provider_id,
        association_id: user.id,
        terms: contractTerms,
        association_signed_at: now,
        provider_signed_at: now,
      } as any);

      await supabase
        .from("projects")
        .update({ status: "in_progress" as any, assigned_provider_id: bid.provider_id })
        .eq("id", projectId);

      toast({ title: "تم قبول العرض والدفع من رصيد المنح بنجاح" });
      onOpenChange(false);
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleMixedPayment = async () => {
    if (!user || loadingPayment) return;
    setLoadingPayment(true);
    try {
      if (!skipAcceptBid) {
        await acceptBid.mutateAsync({ bidId: bid.id, projectId, providerId: bid.provider_id, bidPrice: bid.price });
      }

      // Pay the grant portion — deduct full grant portion from balance
      // Calculate the base amount corresponding to the grant portion
      const grantPortionBase = pricing.total > 0 ? Math.round(bid.price * (grantPortionForMixed / pricing.total) * 100) / 100 : 0;
      await payFromGrants.mutateAsync({
        amount: grantPortionBase,
        totalAmount: grantPortionForMixed,
        payeeId: bid.provider_id,
        projectId,
      });

      if (mixedRemainingMethod === "electronic") {
        const { data, error } = await supabase.functions.invoke("moyasar-get-config");
        if (error || !data?.publishable_key) {
          toast({ title: "حدث خطأ أثناء تحميل بوابة الدفع", variant: "destructive" });
          return;
        }
        const paymentContext = {
          type: "project_payment",
          project_id: projectId,
          provider_id: bid.provider_id,
          association_id: user.id,
          subtotal: remainingAfterGrants,
          total: remainingAfterGrants,
          commission: 0,
          vat: 0,
          commission_rate: commissionRate,
          is_mixed_remainder: true,
          grant_portion: grantPortionForMixed,
        };
        sessionStorage.setItem("moyasar_payment_context", JSON.stringify(paymentContext));
        const ctxParam = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(paymentContext)))));
        const callbackUrl = `${window.location.origin}/payment-callback?ctx=${ctxParam}`;
        setMoyasarKey(data.publishable_key);
        setMoyasarCallbackUrl(callbackUrl);
        setShowMoyasarForm(true);
        setStep(1);
      } else if (mixedRemainingMethod === "bank_transfer") {
        if (!receiptFile) {
          toast({ title: "يرجى رفع إيصال التحويل البنكي", variant: "destructive" });
          setLoadingPayment(false);
          return;
        }
        await bankTransfer.mutateAsync({
          receiptFile,
          amount: remainingAfterGrants,
          baseAmount: remainingAfterGrants,
          userId: user.id,
          items: [{
            serviceId: projectId,
            providerId: bid.provider_id,
            price: remainingAfterGrants,
            title: projectTitle,
          }],
        });
        toast({ title: "تم الدفع الجزئي من المنح ورفع إيصال التحويل للمتبقي", description: "سيتم مراجعة الإيصال من الإدارة" });
        onOpenChange(false);
      }
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setLoadingPayment(false);
    }
  };

  const GrantBreakdownCard = () => (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Info className="h-4 w-4" />
        رصيد المنح المتاح لهذا الطلب
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">منح مخصصة للطلب</span>
          <span className="font-medium">{(grantBalance?.projectSpecific ?? 0).toLocaleString()} ر.س</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">رصيد المنح العام</span>
          <span className="font-medium">{(grantBalance?.general ?? 0).toLocaleString()} ر.س</span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span>الإجمالي المتاح</span>
          <span className="text-primary">{totalGrantAvailable.toLocaleString()} ر.س</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>تغطية المنح</span>
          <span>{grantCoveragePercent}%</span>
        </div>
        <Progress value={grantCoveragePercent} className="h-2" />
      </div>
      {hasPartialGrantBalance && (
        <div className="flex justify-between text-sm pt-1">
          <span className="text-muted-foreground">المتبقي للدفع</span>
          <span className="font-bold text-destructive">{remainingAfterGrants.toLocaleString()} ر.س</span>
        </div>
      )}
    </div>
  );

  const BankTransferSection = ({ amount }: { amount: number }) => (
    <div className="space-y-3">
      <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">البنك</span><span className="font-medium">{BANK_INFO.bank}</span></div>
        <Separator />
        <div className="flex justify-between"><span className="text-muted-foreground">اسم الحساب</span><span className="font-medium text-xs">{BANK_INFO.accountName}</span></div>
        <Separator />
        <div className="flex justify-between items-center gap-2">
          <span className="text-muted-foreground">رقم الحساب</span>
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs">{BANK_INFO.accountNumber}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(BANK_INFO.accountNumber); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        <Separator />
        <div className="flex justify-between"><span className="text-muted-foreground">المبلغ</span><span className="font-bold text-primary">{amount.toLocaleString()} ر.س</span></div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm">إيصال التحويل</Label>
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { if (f.size > 5 * 1024 * 1024) { toast({ title: "الحد الأقصى 5 ميجابايت", variant: "destructive" }); return; } setReceiptFile(f); } }} />
        {receiptFile ? (
          <div className="flex items-center gap-2 p-2 rounded border bg-muted/30 text-sm">
            <Upload className="h-4 w-4 text-primary" />
            <span className="flex-1 truncate">{receiptFile.name}</span>
            <Button variant="ghost" size="sm" onClick={() => setReceiptFile(null)}>تغيير</Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 me-1" /> رفع إيصال التحويل
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {skipAcceptBid ? "متابعة الدفع" : "قبول العرض والدفع"}
          </DialogTitle>
        </DialogHeader>

        <StepProgress steps={steps} currentStep={step} className="my-4" />

        {step === 0 && (
          <div className="space-y-4">
            {/* Bid summary */}
            <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">مقدم الخدمة</span>
                <span className="font-medium">{(bid.profiles as any)?.organization_name || bid.profiles?.full_name || "مقدم خدمة"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">سعر العرض</span>
                <span className="font-medium">{bid.price} ر.س</span>
              </div>
            </div>

            <PricingBreakdownDisplay pricing={pricing} />

            {/* Grant balance breakdown for associations */}
            {isAssociation && totalGrantAvailable > 0 && <GrantBreakdownCard />}

            {/* Payment method selection */}
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              className="space-y-2"
            >
              <div className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === "electronic" ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value="electronic" id="bid-electronic" />
                <Label htmlFor="bid-electronic" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">دفع إلكتروني</p>
                    <p className="text-xs text-muted-foreground">يتم الدفع فوراً وحجز المبلغ في الضمان</p>
                  </div>
                </Label>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === "bank_transfer" ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value="bank_transfer" id="bid-bank" />
                <Label htmlFor="bid-bank" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">تحويل بنكي</p>
                    <p className="text-xs text-muted-foreground">حوّل المبلغ وارفع إيصال التحويل للمراجعة</p>
                  </div>
                </Label>
              </div>

              {hasFullGrantBalance && (
                <div className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === "grant_balance" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="grant_balance" id="bid-grant" />
                  <Label htmlFor="bid-grant" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Wallet className="h-5 w-5 text-success" />
                    <div>
                      <p className="font-medium text-sm">الدفع من رصيد المنح</p>
                      <p className="text-xs text-muted-foreground">الرصيد المتاح: {totalGrantAvailable.toLocaleString()} ر.س — يغطي كامل التكلفة</p>
                    </div>
                  </Label>
                </div>
              )}

              {hasPartialGrantBalance && (
                <div className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === "mixed_grant" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="mixed_grant" id="bid-mixed" />
                  <Label htmlFor="bid-mixed" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Wallet className="h-5 w-5 text-warning" />
                    <div>
                      <p className="font-medium text-sm">دفع مختلط (منح + دفع إضافي)</p>
                      <p className="text-xs text-muted-foreground">
                        {grantPortionForMixed.toLocaleString()} ر.س من المنح + {remainingAfterGrants.toLocaleString()} ر.س متبقي
                      </p>
                    </div>
                  </Label>
                </div>
              )}
            </RadioGroup>

            {/* Electronic payment */}
            {paymentMethod === "electronic" && (
              <Button className="w-full" disabled={loadingPayment || acceptBid.isPending} onClick={handleAcceptAndPay}>
                <CreditCard className="h-4 w-4 me-1" />
                {loadingPayment || acceptBid.isPending ? "جاري المعالجة..." : skipAcceptBid ? "المتابعة للدفع" : "قبول العرض والمتابعة للدفع"}
              </Button>
            )}

            {/* Bank transfer */}
            {paymentMethod === "bank_transfer" && (
              <div className="space-y-3">
                <BankTransferSection amount={pricing.total} />
                <Button className="w-full" disabled={!receiptFile || bankTransfer.isPending || acceptBid.isPending} onClick={handleBankTransfer}>
                  {bankTransfer.isPending || acceptBid.isPending ? "جاري المعالجة..." : skipAcceptBid ? "إرسال الإيصال" : "قبول العرض وإرسال الإيصال"}
                </Button>
              </div>
            )}

            {/* Full grant payment */}
            {paymentMethod === "grant_balance" && (
              <Button className="w-full" disabled={loadingPayment || acceptBid.isPending || payFromGrants.isPending} onClick={handleGrantPayment}>
                <Wallet className="h-4 w-4 me-1" />
                {loadingPayment || payFromGrants.isPending ? "جاري المعالجة..." : skipAcceptBid ? "الدفع من المنح" : "قبول العرض والدفع من المنح"}
              </Button>
            )}

            {/* Mixed payment */}
            {paymentMethod === "mixed_grant" && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">سيتم خصمه من المنح</span>
                    <span className="font-semibold text-success">{grantPortionForMixed.toLocaleString()} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المتبقي للدفع</span>
                    <span className="font-semibold text-destructive">{remainingAfterGrants.toLocaleString()} ر.س</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">طريقة دفع المتبقي</Label>
                  <RadioGroup
                    value={mixedRemainingMethod}
                    onValueChange={(v) => setMixedRemainingMethod(v as "electronic" | "bank_transfer")}
                    className="space-y-2"
                  >
                    <div className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${mixedRemainingMethod === "electronic" ? "border-primary bg-primary/5" : "border-border"}`}>
                      <RadioGroupItem value="electronic" id="mixed-electronic" />
                      <Label htmlFor="mixed-electronic" className="flex items-center gap-2 cursor-pointer flex-1 text-sm">
                        <CreditCard className="h-4 w-4 text-primary" />
                        دفع إلكتروني
                      </Label>
                    </div>
                    <div className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${mixedRemainingMethod === "bank_transfer" ? "border-primary bg-primary/5" : "border-border"}`}>
                      <RadioGroupItem value="bank_transfer" id="mixed-bank" />
                      <Label htmlFor="mixed-bank" className="flex items-center gap-2 cursor-pointer flex-1 text-sm">
                        <Building2 className="h-4 w-4 text-primary" />
                        تحويل بنكي
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {mixedRemainingMethod === "bank_transfer" && (
                  <BankTransferSection amount={remainingAfterGrants} />
                )}

                <Button
                  className="w-full"
                  disabled={loadingPayment || acceptBid.isPending || payFromGrants.isPending || (mixedRemainingMethod === "bank_transfer" && !receiptFile)}
                  onClick={handleMixedPayment}
                >
                  <Wallet className="h-4 w-4 me-1" />
                  {loadingPayment || payFromGrants.isPending ? "جاري المعالجة..." : skipAcceptBid ? "الدفع المختلط" : "قبول العرض والدفع المختلط"}
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 1 && showMoyasarForm && moyasarKey && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              {paymentMethod === "mixed_grant"
                ? `تم خصم ${grantPortionForMixed.toLocaleString()} ر.س من المنح. أكمل دفع المتبقي (${remainingAfterGrants.toLocaleString()} ر.س).`
                : "تم قبول العرض. أكمل عملية الدفع لإنشاء الضمان المالي وبدء العمل."}
            </p>
            <MoyasarPaymentForm
              amount={paymentMethod === "mixed_grant" ? remainingAfterGrants : pricing.total}
              description={`دفع ضمان مالي — ${projectTitle}`}
              callbackUrl={moyasarCallbackUrl}
              publishableKey={moyasarKey}
              metadata={moyasarMetadata}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
