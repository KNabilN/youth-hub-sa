import { DashboardLayout } from "@/components/DashboardLayout";
import { AssociationCard } from "@/components/donor/AssociationCard";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function Associations() {
  const { data: associations, isLoading } = useQuery({
    queryKey: ["associations"],
    queryFn: async () => {
      const { data: ids, error: rpcError } = await supabase.rpc("get_verified_association_ids");
      if (rpcError) throw rpcError;
      if (!ids?.length) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", ids);
      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الجمعيات</h1>
            <p className="text-sm text-muted-foreground">تصفح الجمعيات الشبابية الموثقة</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-44 w-full" />)}</div>
        ) : !associations?.length ? (
          <EmptyState icon={Users} title="لا توجد جمعيات موثقة حالياً" description="ستظهر الجمعيات الموثقة هنا قريباً" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {associations.map((a) => (
              <Link key={a.id} to={`/associations/${a.id}`} className="block hover:scale-[1.01] transition-transform">
                <AssociationCard
                  full_name={a.full_name}
                  organization_name={a.organization_name}
                  bio={a.bio}
                  is_verified={a.is_verified}
                  avatar_url={a.avatar_url}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
