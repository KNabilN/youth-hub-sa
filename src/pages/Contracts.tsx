import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useContracts, useSignContract } from "@/hooks/useContracts";
import { ContractCard } from "@/components/contracts/ContractCard";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ScrollText } from "lucide-react";

export default function Contracts() {
  const [filter, setFilter] = useState("all");
  const { role } = useAuth();
  const { data: contracts, isLoading } = useContracts(filter);
  const signContract = useSignContract();
  const { toast } = useToast();

  const handleSign = (id: string) => {
    signContract.mutate(id, {
      onSuccess: () => toast({ title: "تم توقيع العقد بنجاح", description: "سيتم بدء المشروع تلقائياً بعد توقيع جميع الأطراف" }),
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const canSign = (c: any) => {
    if (role === "youth_association" && !c.association_signed_at) return true;
    if (role === "service_provider" && !c.provider_signed_at) return true;
    return false;
  };

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
        ) : !contracts?.length ? (
          <EmptyState icon={ScrollText} title="لا توجد عقود بعد" description="ستظهر عقودك هنا بمجرد قبول العروض وإنشاء العقود" />
        ) : (
          <div className="space-y-3">
            {/* Show contracts needing signature first */}
            {[...contracts].sort((a: any, b: any) => {
              const aNeeds = canSign(a) ? 0 : 1;
              const bNeeds = canSign(b) ? 0 : 1;
              return aNeeds - bNeeds;
            }).map((contract: any) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                canSign={canSign(contract)}
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
