import { useState, useMemo, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ServiceCard } from "@/components/marketplace/ServiceCard";
import { ServiceFilters } from "@/components/marketplace/ServiceFilters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";
import { Store, PackageSearch, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Marketplace() {
  const [category, setCategory] = useState("all");
  const [region, setRegion] = useState("all");
  const [serviceType, setServiceType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const pagination = usePagination();

  // Debounced search using useRef
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = useCallback((v: string) => {
    setSearchQuery(v);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(v);
      pagination.resetPage();
    }, 400);
  }, [pagination]);

  const { data: services, isLoading } = useQuery({
    queryKey: ["marketplace", category, region, serviceType, debouncedSearch, priceMin, priceMax, pagination.from, pagination.to],
    queryFn: async () => {
      let query = supabase
        .from("micro_services")
        .select("*, categories(*), regions(*), profiles:provider_id(full_name)")
        .eq("approval", "approved")
        .order("created_at", { ascending: false })
        .range(pagination.from, pagination.to);
      if (category !== "all") query = query.eq("category_id", category);
      if (region !== "all") query = query.eq("region_id", region);
      if (serviceType !== "all") query = query.eq("service_type", serviceType as any);
      if (debouncedSearch.trim()) query = query.or(`title.ilike.%${debouncedSearch.trim()}%,description.ilike.%${debouncedSearch.trim()}%`);
      if (priceMin) query = query.gte("price", Number(priceMin));
      if (priceMax) query = query.lte("price", Number(priceMax));
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

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

  const handleCategoryChange = (v: string) => { setCategory(v); pagination.resetPage(); };
  const handleRegionChange = (v: string) => { setRegion(v); pagination.resetPage(); };
  const handleServiceTypeChange = (v: string) => { setServiceType(v); pagination.resetPage(); };

  const activeFiltersCount = [category !== "all", region !== "all", serviceType !== "all", !!priceMin, !!priceMax, !!debouncedSearch].filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">سوق الخدمات</h1>
              <p className="text-sm text-muted-foreground mt-0.5">تصفح الخدمات المتاحة من مقدمي الخدمات</p>
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              {activeFiltersCount} فلتر نشط
            </Badge>
          )}
        </div>

        <Card className="border-dashed">
          <CardContent className="py-3 px-4">
            <div className="flex items-end justify-between flex-wrap gap-3">
              <ServiceFilters
                category={category} region={region} serviceType={serviceType}
                searchQuery={searchQuery} priceMin={priceMin} priceMax={priceMax}
                onCategoryChange={handleCategoryChange} onRegionChange={handleRegionChange}
                onServiceTypeChange={handleServiceTypeChange} onSearchChange={handleSearchChange}
                onPriceMinChange={(v) => { setPriceMin(v); pagination.resetPage(); }}
                onPriceMaxChange={(v) => { setPriceMax(v); pagination.resetPage(); }}
              />
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 h-9">
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
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-40 w-full rounded-none" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : !sortedServices.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-muted p-4 rounded-full mb-4">
                <PackageSearch className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">لا توجد خدمات متاحة حالياً</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                لم يتم العثور على خدمات مطابقة لمعايير البحث. جرّب تغيير الفلاتر أو تحقق لاحقاً.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedServices.map(s => <ServiceCard key={s.id} service={s as any} />)}
          </div>
        )}

        <PaginationControls
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalFetched={services?.length ?? 0}
          onPrev={pagination.prevPage}
          onNext={pagination.nextPage}
        />
      </div>
    </DashboardLayout>
  );
}
