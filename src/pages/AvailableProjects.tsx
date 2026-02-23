import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAvailableProjects } from "@/hooks/useAvailableProjects";
import { ProviderProjectCard } from "@/components/provider/ProviderProjectCard";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/useCategories";
import { useRegions } from "@/hooks/useRegions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FolderKanban, Filter } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";

export default function AvailableProjects() {
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState<string>("");
  const [regionId, setRegionId] = useState<string>("");
  const { data: categories } = useCategories();
  const { data: regions } = useRegions();
  const pagination = usePagination();

  const filters = {
    ...(categoryId ? { category_id: categoryId } : {}),
    ...(regionId ? { region_id: regionId } : {}),
  };
  const { data: projects, isLoading } = useAvailableProjects(
    Object.keys(filters).length ? filters : undefined,
    pagination.from,
    pagination.to
  );

  const handleCategoryChange = (v: string) => { setCategoryId(v === "all" ? "" : v); pagination.resetPage(); };
  const handleRegionChange = (v: string) => { setRegionId(v === "all" ? "" : v); pagination.resetPage(); };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <FolderKanban className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">المشاريع المتاحة</h1>
            <p className="text-sm text-muted-foreground">تصفح المشاريع المفتوحة وقدّم عروضك</p>
          </div>
        </div>
        <div className="h-1 w-20 rounded-full bg-gradient-to-l from-primary/60 to-primary" />

        <Card className="bg-muted/30 border-dashed">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={categoryId || "all"} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-48 bg-background"><SelectValue placeholder="جميع التصنيفات" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التصنيفات</SelectItem>
                {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={regionId || "all"} onValueChange={handleRegionChange}>
              <SelectTrigger className="w-48 bg-background"><SelectValue placeholder="جميع المناطق" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المناطق</SelectItem>
                {regions?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}</div>
        ) : !projects?.length ? (
          <EmptyState icon={FolderKanban} title="لا توجد مشاريع متاحة حالياً" description="ستظهر المشاريع المفتوحة هنا عند نشرها من الجمعيات" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <ProviderProjectCard key={p.id} project={p} onViewDetails={(id) => navigate(`/available-projects/${id}`)} />
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
