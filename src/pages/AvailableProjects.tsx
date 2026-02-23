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
import { FolderKanban } from "lucide-react";

export default function AvailableProjects() {
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState<string>("");
  const [regionId, setRegionId] = useState<string>("");
  const { data: categories } = useCategories();
  const { data: regions } = useRegions();

  const filters = {
    ...(categoryId ? { category_id: categoryId } : {}),
    ...(regionId ? { region_id: regionId } : {}),
  };
  const { data: projects, isLoading } = useAvailableProjects(Object.keys(filters).length ? filters : undefined);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">المشاريع المتاحة</h1>

        <div className="flex flex-wrap gap-3">
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-48"><SelectValue placeholder="جميع التصنيفات" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع التصنيفات</SelectItem>
              {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={regionId} onValueChange={(v) => setRegionId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-48"><SelectValue placeholder="جميع المناطق" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المناطق</SelectItem>
              {regions?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-44 w-full" />)}</div>
        ) : !projects?.length ? (
          <EmptyState icon={FolderKanban} title="لا توجد مشاريع متاحة حالياً" description="ستظهر المشاريع المفتوحة هنا عند نشرها من الجمعيات" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <ProviderProjectCard key={p.id} project={p} onViewDetails={(id) => navigate(`/available-projects/${id}`)} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
