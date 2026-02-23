import { DashboardLayout } from "@/components/DashboardLayout";
import { AssociationCard } from "@/components/donor/AssociationCard";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

export default function Associations() {
  const { data: associations, isLoading } = useQuery({
    queryKey: ["associations"],
    queryFn: async () => {
      // Get user_ids with youth_association role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "youth_association");
      if (roleError) throw roleError;

      if (!roleData?.length) return [];

      const userIds = roleData.map((r) => r.user_id);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds)
        .eq("is_verified", true);
      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">الجمعيات</h1>
          <p className="text-muted-foreground text-sm mt-1">تصفح الجمعيات الشبابية الموثقة</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-44 w-full" />)}</div>
        ) : !associations?.length ? (
          <EmptyState icon={Users} title="لا توجد جمعيات موثقة حالياً" description="ستظهر الجمعيات الموثقة هنا قريباً" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {associations.map((a) => (
              <AssociationCard
                key={a.id}
                full_name={a.full_name}
                organization_name={a.organization_name}
                bio={a.bio}
                is_verified={a.is_verified}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
