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
import { useAssociationGrantBalance } from "@/hooks/useAssociationGrants";
import { usePayFromGrants } from "@/hooks/usePayFromGrants";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Building2, Shield, Check, Copy, Upload, Wallet } from "lucide-react";

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
}

export function BidPaymentDialog({ open, onOpenChange, bid, projectId, projectTitle }: BidPaymentDialogProps) {
  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"electronic" | "bank_transfer" | "grant_balance">("electronic");
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
  const { data: grantBalance } = useAssociationGrantBalance();
  const payFromGrants = usePayFromGrants();

  const pricing = useMemo(() => calculatePricing(bid.price, commissionRate), [bid.price, commissionRate]);
  const hasGrantBalance = role === "youth_association" && (grantBalance?.available ?? 0) >= pricing.total;

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
    if (!user) return;
    setLoadingPayment(true);
    try {
      // First accept the bid (assigns provider, rejects others)
      await acceptBid.mutateAsync({ bidId: bid.id, projectId, providerId: bid.provider_id });

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
    if (!receiptFile || !user) return;
    try {
      // First accept the bid
      await acceptBid.mutateAsync({ bidId: bid.id, projectId, providerId: bid.provider_id });

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
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            قبول العرض والدفع
          </DialogTitle>
        </DialogHeader>

        <StepProgress steps={steps} currentStep={step} className="my-4" />

        {step === 0 && (
          <div className="space-y-4">
            {/* Bid summary */}
            <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">مقدم الخدمة</span>
                <span className="font-medium">{bid.profiles?.full_name || "مقدم خدمة"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">سعر العرض</span>
                <span className="font-medium">{bid.price} ر.س</span>
              </div>
            </div>

            {/* Pricing breakdown */}
            <PricingBreakdownDisplay pricing={pricing} />

            {/* Payment method selection */}
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as "electronic" | "bank_transfer" | "grant_balance")}
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
              {hasGrantBalance && (
                <div className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === "grant_balance" ? "border-primary bg-primary/5" : "border-border"}`}>
                  <RadioGroupItem value="grant_balance" id="bid-grant" />
                  <Label htmlFor="bid-grant" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Wallet className="h-5 w-5 text-success" />
                    <div>
                      <p className="font-medium text-sm">الدفع من رصيد المنح</p>
                      <p className="text-xs text-muted-foreground">الرصيد المتاح: {grantBalance?.available?.toLocaleString()} ر.س</p>
                    </div>
                  </Label>
                </div>
              )}
            </RadioGroup>

            {paymentMethod === "electronic" && (
              <Button
                className="w-full"
                disabled={loadingPayment || acceptBid.isPending}
                onClick={handleAcceptAndPay}
              >
                <CreditCard className="h-4 w-4 me-1" />
                {loadingPayment || acceptBid.isPending ? "جاري المعالجة..." : "قبول العرض والمتابعة للدفع"}
              </Button>
            )}

            {paymentMethod === "bank_transfer" && (
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
                  <div className="flex justify-between"><span className="text-muted-foreground">المبلغ</span><span className="font-bold text-primary">{pricing.total.toLocaleString()} ر.س</span></div>
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
                <Button
                  className="w-full"
                  disabled={!receiptFile || bankTransfer.isPending || acceptBid.isPending}
                  onClick={handleBankTransfer}
                >
                  {bankTransfer.isPending || acceptBid.isPending ? "جاري المعالجة..." : "قبول العرض وإرسال الإيصال"}
                </Button>
              </div>
            )}

            {paymentMethod === "grant_balance" && (
              <Button
                className="w-full"
                disabled={loadingPayment || acceptBid.isPending || payFromGrants.isPending}
                onClick={async () => {
                  if (!user) return;
                  setLoadingPayment(true);
                  try {
                    await acceptBid.mutateAsync({ bidId: bid.id, projectId, providerId: bid.provider_id });
                    await payFromGrants.mutateAsync({
                      amount: bid.price,
                      payeeId: bid.provider_id,
                      projectId,
                    });

                    // Create contract (same as electronic payment flow)
                    await supabase.from("contracts").insert({
                      project_id: projectId,
                      provider_id: bid.provider_id,
                      association_id: user.id,
                      terms: `عقد تنفيذ مشروع "${projectTitle}" بقيمة ${bid.price} ر.س`,
                    });

                    // Update project status to in_progress
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
                }}
              >
                <Wallet className="h-4 w-4 me-1" />
                {loadingPayment || payFromGrants.isPending ? "جاري المعالجة..." : "قبول العرض والدفع من المنح"}
              </Button>
            )}
          </div>
        )}

        {step === 1 && showMoyasarForm && moyasarKey && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              تم قبول العرض. أكمل عملية الدفع لإنشاء الضمان المالي وبدء العمل.
            </p>
            <MoyasarPaymentForm
              amount={pricing.total}
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
