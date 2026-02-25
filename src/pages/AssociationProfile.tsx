import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { StarRating } from "@/components/ratings/StarRating";
import { RatingDistribution } from "@/components/ratings/RatingDistribution";
import { Users, FolderKanban, Star, Building2, Phone, FileText } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

function useAssociationProfile(id: string | undefined) {
  return useQuery({
    queryKey: ["association-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

function useAssociationProjects(id: string | undefined) {
  return useQuery({
    queryKey: ["association-projects", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, status, budget, created_at, category_id, categories(name)")
        .eq("association_id", id!)
        .in("status", ["open", "in_progress", "completed"])
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

function useAssociationRatings(id: string | undefined) {
  return useQuery({
    queryKey: ["association-ratings", id],
    queryFn: async () => {
      const { data: contracts, error: cErr } = await supabase
        .from("contracts")
        .select("id")
        .eq("association_id", id!);
      if (cErr) throw cErr;
      if (!contracts?.length) return { ratings: [], avg: 0, count: 0 };

      const contractIds = contracts.map(c => c.id);
      const { data: ratings, error: rErr } = await supabase
        .from("ratings")
        .select("*, profiles:rater_id(full_name)")
        .in("contract_id", contractIds)
        .order("created_at", { ascending: false })
        .limit(20);
      if (rErr) throw rErr;

      const count = ratings?.length ?? 0;
      const avg = count > 0
        ? ratings!.reduce((s, r) => s + (r.quality_score + r.timing_score + r.communication_score) / 3, 0) / count
        : 0;

      return { ratings: ratings ?? [], avg: Math.round(avg * 10) / 10, count };
    },
    enabled: !!id,
  });
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  open: { label: "مفتوح", variant: "outline" },
  in_progress: { label: "قيد التنفيذ", variant: "default" },
  completed: { label: "مكتمل", variant: "secondary" },
};

export default function AssociationProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: profile, isLoading: profileLoading } = useAssociationProfile(id);
  const { data: projects, isLoading: projectsLoading } = useAssociationProjects(id);
  const { data: ratingsData, isLoading: ratingsLoading } = useAssociationRatings(id);

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <EmptyState icon={Users} title="الجمعية غير موجودة" description="لم يتم العثور على هذه الجمعية" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-l from-primary/20 via-primary/10 to-transparent p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{profile.organization_name || profile.full_name}</h1>
                  {profile.is_verified && (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30">موثقة</Badge>
                  )}
                </div>
                {profile.organization_name && (
                  <p className="text-sm text-muted-foreground">{profile.full_name}</p>
                )}
                <p className="text-sm text-muted-foreground max-w-2xl">{profile.bio || "لا يوجد وصف"}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  {profile.phone && (
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{profile.phone}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-warning" />
                    {ratingsLoading ? "..." : `${ratingsData?.avg ?? 0} (${ratingsData?.count ?? 0} تقييم)`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <FolderKanban className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{projectsLoading ? "..." : projects?.length ?? 0}</p>
              <p className="text-sm text-muted-foreground">مشاريع</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Star className="h-6 w-6 mx-auto text-warning mb-2" />
              <p className="text-2xl font-bold">{ratingsLoading ? "..." : ratingsData?.avg ?? 0}</p>
              <p className="text-sm text-muted-foreground">متوسط التقييم</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{ratingsLoading ? "..." : ratingsData?.count ?? 0}</p>
              <p className="text-sm text-muted-foreground">تقييمات</p>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        {!ratingsLoading && ratingsData?.ratings && ratingsData.ratings.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">توزيع التقييمات</CardTitle></CardHeader>
            <CardContent>
              <RatingDistribution ratings={ratingsData.ratings} />
            </CardContent>
          </Card>
        )}

        {/* Projects */}
        <Card>
          <CardHeader><CardTitle className="text-lg">المشاريع</CardTitle></CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !projects?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد مشاريع حالياً</p>
            ) : (
              <div className="space-y-2">
                {projects.map(p => {
                  const st = statusLabels[p.status] ?? statusLabels.open;
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {(p.categories as any)?.name ?? "بدون تصنيف"} · {format(new Date(p.created_at), "yyyy/MM/dd", { locale: ar })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={st.variant}>{st.label}</Badge>
                        {p.budget && <span className="text-xs text-muted-foreground">{Number(p.budget).toLocaleString()} ر.س</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ratings List */}
        <Card>
          <CardHeader><CardTitle className="text-lg">آخر التقييمات</CardTitle></CardHeader>
          <CardContent>
            {ratingsLoading ? (
              <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : !ratingsData?.ratings?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد تقييمات بعد</p>
            ) : (
              <div className="space-y-3">
                {ratingsData.ratings.map(r => {
                  const avg = (r.quality_score + r.timing_score + r.communication_score) / 3;
                  return (
                    <div key={r.id} className="p-3 rounded-lg border space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{(r.profiles as any)?.full_name ?? "مقيّم"}</p>
                        <StarRating value={Math.round(avg)} readonly size="sm" />
                      </div>
                      {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                        <span>الجودة: {r.quality_score}/5</span>
                        <span>الالتزام: {r.timing_score}/5</span>
                        <span>التواصل: {r.communication_score}/5</span>
                        <span>{format(new Date(r.created_at), "yyyy/MM/dd", { locale: ar })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
