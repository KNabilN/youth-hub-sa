import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Building2, Upload, Copy, Check, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const BANK_INFO = {
  bank: "مصرف الراجحي",
  accountName: "شركة معين التنموية لحلول الاعمال",
  accountNumber: "161000010006080221187",
};

interface DonationPaymentStepProps {
  amount: number;
  targetLabel: string;
  onConfirm: (method: "electronic" | "bank_transfer", receiptFile?: File) => Promise<void>;
  onBack: () => void;
  isProcessing: boolean;
}

export function DonationPaymentStep({ amount, targetLabel, onConfirm, onBack, isProcessing }: DonationPaymentStepProps) {
  const [paymentMethod, setPaymentMethod] = useState<"electronic" | "bank_transfer">("electronic");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(BANK_INFO.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("تم نسخ رقم الحساب");
  };

  const handleSubmit = async () => {
    if (paymentMethod === "bank_transfer" && !receiptFile) {
      toast.error("يرجى رفع صورة إيصال التحويل");
      return;
    }
    await onConfirm(paymentMethod, receiptFile ?? undefined);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border-primary/30">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">المنحة</p>
              <p className="font-medium">{targetLabel}</p>
            </div>
            <span className="text-xl font-bold text-primary">{amount.toLocaleString()} ر.س</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">طريقة الدفع</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as "electronic" | "bank_transfer")}
            className="space-y-3"
          >
            <div className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === "electronic" ? "border-primary bg-primary/5" : "border-border"}`}>
              <RadioGroupItem value="electronic" id="donation-electronic" />
              <Label htmlFor="donation-electronic" className="flex items-center gap-2 cursor-pointer flex-1">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">دفع إلكتروني</p>
                  <p className="text-xs text-muted-foreground">يتم الدفع فوراً وحجز المبلغ في الضمان</p>
                </div>
              </Label>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === "bank_transfer" ? "border-primary bg-primary/5" : "border-border"}`}>
              <RadioGroupItem value="bank_transfer" id="donation-bank" />
              <Label htmlFor="donation-bank" className="flex items-center gap-2 cursor-pointer flex-1">
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

      {/* Bank Transfer Details */}
      {paymentMethod === "bank_transfer" && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              بيانات الحساب البنكي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">البنك</span>
                <span className="font-medium">{BANK_INFO.bank}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">اسم الحساب</span>
                <span className="font-medium text-sm">{BANK_INFO.accountName}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm text-muted-foreground">رقم الحساب</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-sm">{BANK_INFO.accountNumber}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyAccount}>
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">المبلغ المطلوب</span>
                <span className="font-bold text-primary">{amount.toLocaleString()} ر.س</span>
              </div>
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">إيصال التحويل</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("الحد الأقصى لحجم الملف 5 ميجابايت");
                      return;
                    }
                    setReceiptFile(file);
                  }
                }}
              />
              {receiptFile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <Upload className="h-5 w-5 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{receiptFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(receiptFile.size / 1024).toFixed(0)} كيلوبايت</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setReceiptFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                    تغيير
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full h-20 border-dashed" onClick={() => fileInputRef.current?.click()}>
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">اضغط لرفع صورة الإيصال</span>
                    <span className="text-[10px] text-muted-foreground">PNG, JPG, PDF (حد أقصى 5MB)</span>
                  </div>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>
              {paymentMethod === "electronic"
                ? "سيتم حجز المبلغ في نظام الضمان المالي حتى إتمام الخدمة"
                : "سيتم مراجعة إيصال التحويل من الإدارة وحجز المبلغ بعد الموافقة"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={isProcessing} className="flex-1">
          <ArrowRight className="h-4 w-4 me-2" />
          رجوع
        </Button>
        <Button onClick={handleSubmit} disabled={isProcessing} className="flex-1">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
          {isProcessing ? "جاري المعالجة..." : "تأكيد الدفع"}
        </Button>
      </div>
    </div>
  );
}
