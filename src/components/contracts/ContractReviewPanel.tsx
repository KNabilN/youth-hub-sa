import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Check, Clock, PenLine, Shield, Scale, Lock, BookOpen, XCircle } from "lucide-react";
import { useSignContract, useUpdateContractTerms } from "@/hooks/useContracts";
import { toast } from "@/hooks/use-toast";

const LEGAL_CLAUSES = [
  { icon: Scale, text: "تدار هذه الاتفاقية وتُفسر وفقاً لأنظمة المملكة العربية السعودية." },
  { icon: Shield, text: "تتولى المنصة الفصل في أي نزاع ينشأ بين الأطراف وفق الآليات المعتمدة." },
  { icon: Lock, text: "يلتزم الطرفان بالحفاظ على سرية جميع المعلومات المتبادلة خلال فترة التعاقد وبعدها." },
  { icon: BookOpen, text: "تنتقل حقوق الملكية الفكرية للأعمال المنجزة إلى الطرف الأول (الجمعية) بعد إتمام الدفع." },
  { icon: XCircle, text: "يحق لأي طرف إلغاء العقد قبل بدء التنفيذ مع استرداد كامل المبلغ عبر نظام الضمان المالي." },
];

interface ContractReviewPanelProps {
  contract: any;
  escrow?: any;
  isAssociation: boolean;
  isProvider: boolean;
}

function extractScope(terms: string): string {
  // Try to extract scope section from structured terms
  const scopeMatch = terms.match(/نطاق العمل:\s*([\s\S]*?)(?:\n\d+\.|$)/);
  if (scopeMatch) return scopeMatch[1].trim();
  // If simple terms, return as-is (legacy)
  return terms;
}

export function ContractReviewPanel({ contract, escrow, isAssociation, isProvider }: ContractReviewPanelProps) {
  const signContract = useSignContract();
  const updateTerms = useUpdateContractTerms();
  const [editingScope, setEditingScope] = useState(false);
  const [scope, setScope] = useState(extractScope(contract.terms));

  const isBothSigned = contract.association_signed_at && contract.provider_signed_at;
  const canAssociationSign = isAssociation && !contract.association_signed_at;
  const canProviderSign = isProvider && !contract.provider_signed_at;
  const canEditScope = isAssociation && !contract.association_signed_at;

  const handleSaveScope = () => {
    updateTerms.mutate(
      { contractId: contract.id, scope },
      {
        onSuccess: () => {
          toast({ title: "تم حفظ نطاق العمل بنجاح" });
          setEditingScope(false);
        },
        onError: () => toast({ title: "حدث خطأ في حفظ التعديلات", variant: "destructive" }),
      }
    );
  };

  const handleSign = () => {
    signContract.mutate(contract.id, {
      onSuccess: () => toast({ title: "تم توقيع العقد بنجاح ✅", description: "سيتم إشعار الطرف الآخر" }),
      onError: (err: any) => toast({ title: "حدث خطأ", description: err?.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      {/* Signature needed banner */}
      {(canAssociationSign || canProviderSign) && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <PenLine className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">مطلوب توقيعك على هذا العقد</p>
              <p className="text-xs text-muted-foreground">
                {canAssociationSign
                  ? "يرجى مراجعة نطاق العمل والبنود ثم التوقيع. يمكنك تعديل نطاق العمل قبل التوقيع."
                  : "يرجى مراجعة بنود العقد ونطاق العمل ثم التوقيع لبدء التنفيذ."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              عقد تنفيذ
            </CardTitle>
            <Badge variant={isBothSigned ? "default" : contract.association_signed_at || contract.provider_signed_at ? "secondary" : "outline"}>
              {isBothSigned ? "موقّع بالكامل" : contract.association_signed_at || contract.provider_signed_at ? "موقّع جزئياً" : "بانتظار التوقيع"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="text-xs text-muted-foreground">الطرف الأول (الجمعية)</p>
              <p className="font-medium">{contract.association_profiles?.organization_name || contract.association_profiles?.full_name || "—"}</p>
              <div className="flex items-center gap-1 text-xs">
                {contract.association_signed_at ? (
                  <><Check className="h-3 w-3 text-green-600" /> <span className="text-green-600">وقّع في {new Date(contract.association_signed_at).toLocaleDateString("ar-SA")}</span></>
                ) : (
                  <><Clock className="h-3 w-3 text-muted-foreground" /> <span className="text-muted-foreground">لم يوقّع بعد</span></>
                )}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 space-y-1">
              <p className="text-xs text-muted-foreground">الطرف الثاني (مقدم الخدمة)</p>
              <p className="font-medium">{contract.profiles?.full_name || "—"}</p>
              <div className="flex items-center gap-1 text-xs">
                {contract.provider_signed_at ? (
                  <><Check className="h-3 w-3 text-green-600" /> <span className="text-green-600">وقّع في {new Date(contract.provider_signed_at).toLocaleDateString("ar-SA")}</span></>
                ) : (
                  <><Clock className="h-3 w-3 text-muted-foreground" /> <span className="text-muted-foreground">لم يوقّع بعد</span></>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Work Scope */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">نطاق العمل</h3>
              {canEditScope && !editingScope && (
                <Button variant="ghost" size="sm" onClick={() => setEditingScope(true)}>
                  <PenLine className="h-3.5 w-3.5 me-1" />
                  تعديل
                </Button>
              )}
            </div>
            {editingScope ? (
              <div className="space-y-2">
                <Textarea
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  rows={5}
                  className="text-sm"
                  placeholder="وصف نطاق العمل المطلوب..."
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveScope} disabled={updateTerms.isPending}>
                    {updateTerms.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setScope(extractScope(contract.terms)); setEditingScope(false); }}>
                    إلغاء
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg border bg-background text-sm whitespace-pre-wrap leading-relaxed">
                {scope || "لم يتم تحديد نطاق العمل"}
              </div>
            )}
          </div>

          {/* Financial Details */}
          {escrow && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">التفاصيل المالية</h3>
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">قيمة العقد</span>
                    <span className="font-bold">{Number(escrow.amount).toLocaleString()} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">حالة الضمان المالي</span>
                    <Badge variant={escrow.status === "held" ? "secondary" : escrow.status === "released" ? "default" : "outline"} className="text-xs">
                      {escrow.status === "held" ? "محتجز" : escrow.status === "released" ? "محرر" : escrow.status === "refunded" ? "مسترد" : escrow.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Legal Clauses */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">البنود والأحكام العامة</h3>
            <div className="space-y-2">
              {LEGAL_CLAUSES.map((clause, idx) => {
                const Icon = clause.icon;
                return (
                  <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30 text-sm">
                    <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{clause.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Sign Button */}
          {(canAssociationSign || canProviderSign) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full" size="lg" disabled={signContract.isPending}>
                  <PenLine className="h-4 w-4 me-2" />
                  توقيع العقد إلكترونياً
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد التوقيع</AlertDialogTitle>
                  <AlertDialogDescription>
                    بالتوقيع على هذا العقد، أنت توافق على جميع البنود والأحكام المذكورة أعلاه بما في ذلك نطاق العمل المحدد.
                    هل أنت متأكد من رغبتك في التوقيع؟
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>تراجع</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSign} disabled={signContract.isPending}>
                    {signContract.isPending ? "جاري التوقيع..." : "تأكيد التوقيع"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Contract date */}
          <p className="text-xs text-muted-foreground text-center">
            تاريخ إنشاء العقد: {new Date(contract.created_at).toLocaleDateString("ar-SA")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
