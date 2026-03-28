import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVerificationGuard } from "@/hooks/useVerificationGuard";
import { ProviderProjectCard } from "@/components/provider/ProviderProjectCard";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/useCategories";
import { useRegions } from "@/hooks/useRegions";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Filter, Search, DollarSign, ArrowUpDown } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";

export default function AvailableProjects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isVerified, guardAction } = useVerificationGuard();
  const [categoryId, setCategoryId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const { data: categories } = useCategories();
  const { data: regions } = useRegions();
  const pagination = usePagination();

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = (v: string) => {
    setSearchQuery(v);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(v);
      pagination.resetPage();
    }, 400);
  };

  const { data: myBidProjectIds } = useQuery({
    queryKey: ["my-bid-project-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bids")
        .select("project_id")
        .eq("provider_id", user!.id)
        .is("deleted_at", null);
      if (error) throw error;
      return new Set(data.map(b => b.project_id));
    },
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ["available-projects", user?.id, categoryId, regionId, debouncedSearch, budgetMin, budgetMax, sortBy, pagination.from, pagination.to],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from("projects")
        .select("*, categories(*), regions(*), profiles!projects_association_id_fkey(full_name, avatar_url, organization_name)")
        .eq("status", "open")
        .eq("is_private", false)
        .range(pagination.from, pagination.to);

      // Sort
      if (sortBy === "newest") query = query.order("created_at", { ascending: false });
      else if (sortBy === "oldest") query = query.order("created_at", { ascending: true });
      else if (sortBy === "budget_asc") query = query.order("budget", { ascending: true, nullsFirst: false });
      else if (sortBy === "budget_desc") query = query.order("budget", { ascending: false, nullsFirst: true });
      else query = query.order("created_at", { ascending: false });

      if (categoryId) query = query.eq("category_id", categoryId);
      if (regionId) query = query.eq("region_id", regionId);
      if (debouncedSearch.trim()) query = query.or(`title.ilike.%${debouncedSearch.trim()}%,description.ilike.%${debouncedSearch.trim()}%`);
      if (budgetMin) query = query.gte("budget", Number(budgetMin));
      if (budgetMax) query = query.lte("budget", Number(budgetMax));

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleCategoryChange = (v: string) => { setCategoryId(v === "all" ? "" : v); pagination.resetPage(); };
  const handleRegionChange = (v: string) => { setRegionId(v === "all" ? "" : v); pagination.resetPage(); };

  const activeFiltersCount = [!!categoryId, !!regionId, !!debouncedSearch, !!budgetMin, !!budgetMax].filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <FolderKanban className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">طلبات الجمعيات المتاحة</h1>
              <p className="text-sm text-muted-foreground">تصفح الطلبات المفتوحة وقدّم عروضك</p>
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              {activeFiltersCount} فلتر نشط
            </Badge>
          )}
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="ابحث عن طلب بالاسم أو الوصف..."
                className="pe-9 h-10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={categoryId || "all"} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[150px] h-9 bg-background"><SelectValue placeholder="جميع التصنيفات" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع التصنيفات</SelectItem>
                  {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={regionId || "all"} onValueChange={handleRegionChange}>
                <SelectTrigger className="w-[150px] h-9 bg-background"><SelectValue placeholder="جميع المناطق" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المناطق</SelectItem>
                  {regions?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Budget range */}
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input type="number" value={budgetMin} onChange={e => { setBudgetMin(e.target.value); pagination.resetPage(); }} placeholder="من" className="w-[80px] h-9 bg-background" min={0} />
                <span className="text-xs text-muted-foreground">-</span>
                <Input type="number" value={budgetMax} onChange={e => { setBudgetMax(e.target.value); pagination.resetPage(); }} placeholder="إلى" className="w-[80px] h-9 bg-background" min={0} />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1.5 ms-auto">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(v) => { setSortBy(v); pagination.resetPage(); }}>
                  <SelectTrigger className="w-[140px] h-9 bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">الأحدث</SelectItem>
                    <SelectItem value="oldest">الأقدم</SelectItem>
                    <SelectItem value="budget_desc">الميزانية: الأعلى</SelectItem>
                    <SelectItem value="budget_asc">الميزانية: الأقل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
          </div>
        ) : !projects?.length ? (
          <EmptyState icon={FolderKanban} title="لا توجد طلبات متاحة حالياً" description="لم يتم العثور على طلبات مطابقة. جرّب تغيير الفلاتر أو تحقق لاحقاً." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <ProviderProjectCard key={p.id} project={p} hasBid={myBidProjectIds?.has(p.id)} onViewDetails={(id) => guardAction(() => navigate(`/available-projects/${id}`))} />
            ))}
          </div>
        )}

        <PaginationControls
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalFetched={projects?.length ?? 0}
          onPrev={pagination.prevPage}
          onNext={pagination.nextPage}
        />
      </div>
    </DashboardLayout>
  );
}
