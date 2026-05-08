import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PenLine } from "lucide-react";
import { useSignContract, useUpdateContractTerms } from "@/hooks/useContracts";
import { useContractDocument } from "@/hooks/useContractDocument";
import {
  ContractDocument,
  PrintContractButton,
} from "@/components/contracts/ContractDocument";
import { Skeleton } from "@/components/ui/skeleton";

interface ContractReviewPanelProps {
  contract: any;
  escrow?: any;
  isAssociation: boolean;
  isProvider: boolean;
}

export function ContractReviewPanel({
  contract,
  isAssociation,
  isProvider,
}: ContractReviewPanelProps) {
  const signContract = useSignContract();
  const updateTerms = useUpdateContractTerms();
  const { data, isLoading } = useContractDocument(contract.id);
  const [editingScope, setEditingScope] = useState(false);
  const [scope, setScope] = useState<string>("");

  const canAssociationSign = isAssociation && !contract.association_signed_at;
  const canProviderSign = isProvider && !contract.provider_signed_at;
  const canEditScope = isAssociation && !contract.association_signed_at;

  const currentScope = editingScope ? scope : (data?.scope ?? "");

  const handleStartEdit = () => {
    setScope(data?.scope ?? "");
    setEditingScope(true);
  };

  const handleSaveScope = () => {
    updateTerms.mutate(
      { contractId: contract.id, scope },
      {
        onSuccess: () => {
          toast.success("تم حفظ نطاق العمل بنجاح");
          setEditingScope(false);
        },
        onError: () =>
          toast.error("حدث خطأ في حفظ التعديلات"),
      },
    );
  };

  const handleSign = () => {
    signContract.mutate(contract.id, {
      onSuccess: () =>
        toast.success("تم توقيع العقد بنجاح ✅", { description: "سيتم إشعار الطرف الآخر" }),
      onError: (err: any) =>
        toast.error("حدث خطأ", { description: err?.message }),
    });
  };

  if (isLoading || !data) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-4">
      {/* Action bar (hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="text-sm text-muted-foreground">
          {canAssociationSign || canProviderSign
            ? "مطلوب توقيعك على هذا العقد"
            : "يمكنك مراجعة العقد وطباعته أو حفظه كـ PDF"}
        </div>
        <div className="flex gap-2">
          {canEditScope && !editingScope && (
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              <PenLine className="h-4 w-4 me-1" /> تعديل نطاق العمل
            </Button>
          )}
          <PrintContractButton />
        </div>
      </div>

      {/* Edit scope inline */}
      {editingScope && (
        <Card className="border-primary/40 print:hidden">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-semibold">تعديل نطاق العمل</p>
            <Textarea
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              rows={6}
              className="text-sm"
              placeholder="وصف نطاق العمل المطلوب..."
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveScope}
                disabled={updateTerms.isPending}
              >
                {updateTerms.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingScope(false)}
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contract document */}
      <ContractDocument
        data={data}
        scopeOverride={editingScope ? scope : undefined}
      />

      {/* Sign action */}
      {(canAssociationSign || canProviderSign) && !editingScope && (
        <div className="print:hidden">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="w-full"
                size="lg"
                disabled={signContract.isPending}
              >
                <PenLine className="h-4 w-4 me-2" /> توقيع العقد إلكترونياً
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد التوقيع</AlertDialogTitle>
                <AlertDialogDescription>
                  بالتوقيع على هذا العقد، أنت توافق على جميع المواد والبنود
                  المذكورة بما فيها نطاق العمل والمقابل المالي والمدة. هل أنت
                  متأكد؟
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>تراجع</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSign}
                  disabled={signContract.isPending}
                >
                  {signContract.isPending ? "جاري التوقيع..." : "تأكيد التوقيع"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
