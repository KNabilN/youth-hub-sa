import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useContracts, useSignContract } from "@/hooks/useContracts";
import { ContractCard } from "@/components/contracts/ContractCard";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ScrollText, Info } from "lucide-react";

const MOCK_CONTRACTS = [
  {
    id: "demo-1",
    project_id: "demo-p1",
    projects: { title: "تطوير موقع إلكتروني", status: "in_progress" },
    profiles: { full_name: "أحمد محمد" },
    terms: "تطوير موقع إلكتروني متكامل يشمل التصميم والبرمجة والاستضافة لمدة سنة. المبلغ: 15,000 ر.س",
    association_signed_at: "2025-12-01T10:00:00Z",
    provider_signed_at: "2025-12-02T14:30:00Z",
    created_at: "2025-11-28T08:00:00Z",
  },
  {
    id: "demo-2",
    project_id: "demo-p2",
    projects: { title: "تصميم هوية بصرية", status: "in_progress" },
    profiles: { full_name: "سارة العلي" },
    terms: "تصميم هوية بصرية كاملة تشمل الشعار والألوان والخطوط والقرطاسية. المبلغ: 8,000 ر.س",
    association_signed_at: "2026-01-15T09:00:00Z",
    provider_signed_at: null,
    created_at: "2026-01-10T12:00:00Z",
  },
  {
    id: "demo-3",
    project_id: "demo-p3",
    projects: { title: "إدارة حسابات التواصل الاجتماعي", status: "open" },
    profiles: { full_name: "خالد الشمري" },
    terms: "إدارة حسابات التواصل الاجتماعي لمدة 3 أشهر تشمل إنشاء المحتوى والنشر والتفاعل. المبلغ: 5,000 ر.س",
    association_signed_at: null,
    provider_signed_at: null,
    created_at: "2026-02-20T10:00:00Z",
  },
];

export default function Contracts() {
  const [filter, setFilter] = useState("all");
  const { role } = useAuth();
  const { data: contracts, isLoading } = useContracts(filter);
  const signContract = useSignContract();
  const { toast } = useToast();

  const handleSign = (id: string) => {
    signContract.mutate(id, {
      onSuccess: () => toast({ title: "تم توقيع العقد بنجاح" }),
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const canSign = (c: any) => {
    if (role === "youth_association" && !c.association_signed_at) return true;
    if (role === "service_provider" && !c.provider_signed_at) return true;
    return false;
  };

  const isDemo = !isLoading && !contracts?.length;
  const displayContracts = isDemo ? MOCK_CONTRACTS : contracts;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Styled Page Header */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <ScrollText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">العقود</h1>
            <p className="text-sm text-muted-foreground">إدارة وتوقيع العقود الخاصة بمشاريعك</p>
          </div>
        </div>

        {/* Gradient Divider */}
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {isDemo && (
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm text-muted-foreground">
              هذه بيانات تجريبية للعرض فقط. ستظهر عقودك الحقيقية هنا بمجرد قبول العروض وإنشاء العقود.
            </AlertDescription>
          </Alert>
        )}

        {/* Filter Card */}
        <Card className="border-dashed">
          <CardContent className="py-3 px-4 flex items-center justify-between flex-wrap gap-3">
            <span className="text-sm font-medium text-muted-foreground">تصفية حسب الحالة</span>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع العقود</SelectItem>
                <SelectItem value="unsigned">غير موقّعة</SelectItem>
                <SelectItem value="partial">موقّعة جزئياً</SelectItem>
                <SelectItem value="signed">موقّعة بالكامل</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : (
          <div className="space-y-3">
            {displayContracts?.map((contract: any) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                canSign={isDemo ? false : canSign(contract)}
                onSign={handleSign}
                isSignPending={signContract.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
