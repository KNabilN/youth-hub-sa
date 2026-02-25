import { useState } from "react";
import { useContractVersions, useCreateContractVersion } from "@/hooks/useContractVersions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { History, Plus } from "lucide-react";

interface ContractVersionsListProps {
  contractId: string;
  currentTerms: string;
  canEdit: boolean;
}

export function ContractVersionsList({ contractId, currentTerms, canEdit }: ContractVersionsListProps) {
  const { data: versions, isLoading } = useContractVersions(contractId);
  const createVersion = useCreateContractVersion();
  const [open, setOpen] = useState(false);
  const [terms, setTerms] = useState(currentTerms);
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!terms.trim()) return;
    createVersion.mutate(
      { contractId, terms, changeNote: note },
      {
        onSuccess: () => {
          toast({ title: "تم حفظ الإصدار الجديد" });
          setOpen(false);
          setNote("");
        },
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  if (isLoading) return <Skeleton className="h-20" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-5 w-5" />
          إصدارات العقد
          <Badge variant="secondary">{versions?.length ?? 0}</Badge>
        </CardTitle>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 ml-1" />
                تعديل الشروط
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>تعديل شروط العقد</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={6}
                  placeholder="شروط العقد..."
                />
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="سبب التعديل (اختياري)"
                />
                <Button onClick={handleSubmit} disabled={createVersion.isPending || !terms.trim()}>
                  حفظ الإصدار
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {versions && versions.length > 0 ? (
          <div className="space-y-3">
            {versions.map((v: any) => (
              <div key={v.id} className="border rounded-lg p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">الإصدار {v.version_number}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(v.created_at).toLocaleDateString("ar-SA")}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs line-clamp-2">{v.terms}</p>
                {v.change_note && (
                  <p className="text-xs"><strong>السبب:</strong> {v.change_note}</p>
                )}
                {v.profiles?.full_name && (
                  <p className="text-xs text-muted-foreground">بواسطة: {v.profiles.full_name}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3">لا توجد إصدارات سابقة</p>
        )}
      </CardContent>
    </Card>
  );
}
