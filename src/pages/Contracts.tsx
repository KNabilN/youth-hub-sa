import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useContracts, useSignContract } from "@/hooks/useContracts";
import { ContractCard } from "@/components/contracts/ContractCard";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { FileText } from "lucide-react";

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">العقود</h1>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع العقود</SelectItem>
            <SelectItem value="unsigned">غير موقّعة</SelectItem>
            <SelectItem value="partial">موقّعة جزئياً</SelectItem>
            <SelectItem value="signed">موقّعة بالكامل</SelectItem>
          </SelectContent>
        </Select>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : !contracts?.length ? (
          <EmptyState icon={FileText} title="لا توجد عقود" description="ستظهر العقود هنا بمجرد قبول العروض" />
        ) : (
          <div className="space-y-3">
            {contracts.map((contract: any) => (
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
