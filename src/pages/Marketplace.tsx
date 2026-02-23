import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ServiceCard } from "@/components/marketplace/ServiceCard";
import { ServiceFilters } from "@/components/marketplace/ServiceFilters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Marketplace() {
  const [category, setCategory] = useState("all");
  const [region, setRegion] = useState("all");
  const [serviceType, setServiceType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

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

  // Fetch provider average ratings for sorting
  const { data: ratingsMap } = useQuery({
    queryKey: ["provider-ratings-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ratings")
        .select("contract_id, quality_score, timing_score, communication_score, contracts(provider_id)");
      if (error) throw error;
      const map: Record<string, { total: number; count: number }> = {};
      data?.forEach((r: any) => {
        const pid = r.contracts?.provider_id;
        if (!pid) return;
        if (!map[pid]) map[pid] = { total: 0, count: 0 };
        map[pid].total += (r.quality_score + r.timing_score + r.communication_score) / 3;
        map[pid].count += 1;
      });
      return map;
    },
  });

  const sortedServices = useMemo(() => {
    if (!services) return [];
    const list = [...services];
    if (sortBy === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") list.sort((a, b) => b.price - a.price);
    else if (sortBy === "rating" && ratingsMap) {
      list.sort((a, b) => {
        const ra = ratingsMap[a.provider_id];
        const rb = ratingsMap[b.provider_id];
        const avgA = ra ? ra.total / ra.count : 0;
        const avgB = rb ? rb.total / rb.count : 0;
        return avgB - avgA;
      });
    }
    return list;
  }, [services, sortBy, ratingsMap]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold">سوق الخدمات</h1>
            <p className="text-sm text-muted-foreground mt-1">تصفح الخدمات المتاحة من مقدمي الخدمات</p>
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="ترتيب حسب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">الأحدث</SelectItem>
              <SelectItem value="price_asc">السعر: الأقل</SelectItem>
              <SelectItem value="price_desc">السعر: الأعلى</SelectItem>
              <SelectItem value="rating">التقييم</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ServiceFilters
          category={category} region={region} serviceType={serviceType}
          onCategoryChange={setCategory} onRegionChange={setRegion} onServiceTypeChange={setServiceType}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-52" />)}
          </div>
        ) : !sortedServices.length ? (
          <p className="text-center py-16 text-muted-foreground">لا توجد خدمات متاحة حالياً</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedServices.map(s => <ServiceCard key={s.id} service={s as any} />)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}