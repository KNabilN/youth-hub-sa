import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ServiceCard } from "@/components/marketplace/ServiceCard";
import { ServiceFilters } from "@/components/marketplace/ServiceFilters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function Marketplace() {
  const [category, setCategory] = useState("all");
  const [region, setRegion] = useState("all");
  const [serviceType, setServiceType] = useState("all");

  const { data: services, isLoading } = useQuery({
    queryKey: ["marketplace", category, region, serviceType],
    queryFn: async () => {
      let query = supabase
        .from("micro_services")
        .select("*, categories(*), regions(*), profiles:provider_id(full_name)")
        .eq("approval", "approved")
        .order("created_at", { ascending: false });
      if (category !== "all") query = query.eq("category_id", category);
      if (region !== "all") query = query.eq("region_id", region);
      if (serviceType !== "all") query = query.eq("service_type", serviceType as any);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">سوق الخدمات</h1>
          <p className="text-sm text-muted-foreground mt-1">تصفح الخدمات المتاحة من مقدمي الخدمات</p>
        </div>

        <ServiceFilters
          category={category} region={region} serviceType={serviceType}
          onCategoryChange={setCategory} onRegionChange={setRegion} onServiceTypeChange={setServiceType}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-52" />)}
          </div>
        ) : !services?.length ? (
          <p className="text-center py-16 text-muted-foreground">لا توجد خدمات متاحة حالياً</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(s => <ServiceCard key={s.id} service={s as any} />)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
