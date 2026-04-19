import { useState, useRef, useCallback } from "react";
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
  const [city, setCity] = useState("all");
  const [serviceType, setServiceType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const pagination = usePagination();

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

  const { data, isLoading } = useQuery({
    queryKey: ["marketplace-rpc", category, region, city, serviceType, debouncedSearch, priceMin, priceMax, sortBy, pagination.from, pagination.pageSize],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_marketplace_services" as any, {
        p_category: category !== "all" ? category : null,
        p_region: region !== "all" ? region : null,
        p_city: city !== "all" ? city : null,
        p_service_type: serviceType !== "all" ? serviceType : null,
        p_search: debouncedSearch.trim() || null,
        p_price_min: priceMin ? Number(priceMin) : null,
        p_price_max: priceMax ? Number(priceMax) : null,
        p_sort: sortBy,
        p_offset: pagination.from,
        p_limit: pagination.pageSize,
      });
      if (error) throw error;
      return data as any[];
    },
  });

  // Map flat RPC rows to the nested shape ServiceCard expects
  const services = (data ?? []).map((row: any) => ({
    ...row,
    categories: row.category_id ? { id: row.category_id, name: row.category_name, image_url: null } : null,
    regions: row.region_id ? { id: row.region_id, name: row.region_name } : null,
    cities: row.city_id ? { name: row.city_name } : null,
    profiles: { full_name: row.provider_name },
  }));

  const totalCount = data && data.length > 0 ? Number(data[0].total_count) : 0;

  const handleCategoryChange = (v: string) => { setCategory(v); pagination.resetPage(); };
  const handleRegionChange = (v: string) => { setRegion(v); setCity("all"); pagination.resetPage(); };
  const handleCityChange = (v: string) => { setCity(v); pagination.resetPage(); };
  const handleServiceTypeChange = (v: string) => { setServiceType(v); pagination.resetPage(); };
  const handleSortChange = (v: string) => { setSortBy(v); pagination.resetPage(); };

  const activeFiltersCount = [category !== "all", region !== "all", city !== "all", serviceType !== "all", !!priceMin, !!priceMax, !!debouncedSearch].filter(Boolean).length;

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
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        <Card className="border-dashed">
          <CardContent className="py-3 px-4">
            <div className="flex items-end justify-between flex-wrap gap-3">
              <ServiceFilters
                category={category} region={region} city={city} serviceType={serviceType}
                searchQuery={searchQuery} priceMin={priceMin} priceMax={priceMax}
                onCategoryChange={handleCategoryChange} onRegionChange={handleRegionChange}
                onCityChange={handleCityChange}
                onServiceTypeChange={handleServiceTypeChange} onSearchChange={handleSearchChange}
                onPriceMinChange={(v) => { setPriceMin(v); pagination.resetPage(); }}
                onPriceMaxChange={(v) => { setPriceMax(v); pagination.resetPage(); }}
              />
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={handleSortChange}>
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
        ) : !services.length ? (
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
            {services.map(s => <ServiceCard key={s.id} service={s as any} />)}
          </div>
        )}

        <PaginationControls
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalFetched={services.length}
          totalItems={totalCount}
          onPrev={pagination.prevPage}
          onNext={pagination.nextPage}
        />
      </div>
    </DashboardLayout>
  );
}
