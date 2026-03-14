import { useParams, useNavigate } from "react-router-dom";
import { usePublicProfile, useToggleProfileSave } from "@/hooks/usePublicProfile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ratings/StarRating";
import { RatingDistribution } from "@/components/ratings/RatingDistribution";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import {
  CheckCircle, Eye, Bookmark, BookmarkCheck, Star, Award, Briefcase, GraduationCap, MessageSquare, User as UserIcon, ImageIcon, ArrowRight, Heart, FileText, Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ImageLightbox } from "@/components/ui/image-lightbox";

const roleLabels: Record<string, string> = {
  super_admin: "مدير النظام",
  youth_association: "جمعية شبابية",
  service_provider: "مقدم خدمة",
  donor: "مانح",
};

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, role, services, portfolio, ratings, savesCount, projects } = usePublicProfile(id);
  const { isSaved, toggle: toggleSave } = useToggleProfileSave(id);
  const { user } = useAuth();

  const { data: currentUserRole } = useQuery({
    queryKey: ["my-role", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).maybeSingle();
      return data?.role ?? null;
    },
  });

  const showSupportButton = currentUserRole === "donor" && role.data === "youth_association";
  const isAssociation = role.data === "youth_association";

  const p = profile.data;
  const r = ratings.data ?? [];
  const avgRating = r.length
    ? r.reduce((s: number, rt: any) => s + (rt.quality_score + rt.timing_score + rt.communication_score) / 3, 0) / r.length
    : 0;

  const skills: string[] = (p as any)?.skills ?? [];
  const qualifications: { title: string; description?: string }[] = (p as any)?.qualifications ?? [];
  const coverUrl: string = (p as any)?.cover_image_url || "";
  const views: number = (p as any)?.profile_views ?? 0;

  const statusLabels: Record<string, string> = {
    open: "مفتوح",
    in_progress: "قيد التنفيذ",
    completed: "مكتمل",
    pending_approval: "بانتظار الموافقة",
    cancelled: "ملغي",
    disputed: "مُشتكى عليه",
    suspended: "معلق",
    archived: "مؤرشف",
  };

  if (profile.isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="flex gap-4 -mt-12 px-6">
          <Skeleton className="h-28 w-28 rounded-full shrink-0" />
          <div className="space-y-3 pt-10 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
        <p className="text-lg">لم يتم العثور على هذا الملف الشخصي</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowRight className="h-4 w-4 me-1" /> العودة
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12" dir="rtl">
      {/* Back Button */}
      <div className="px-4 sm:px-6 pt-4 pb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowRight className="h-4 w-4" /> رجوع
        </Button>
      </div>

      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 md:h-72 bg-gradient-to-l from-primary/30 via-primary/10 to-accent/10 rounded-2xl mx-4 sm:mx-6 overflow-hidden shadow-sm">
        {coverUrl ? (
          <img src={coverUrl} alt="غلاف" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 sm:px-8 -mt-16 relative z-10">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <Avatar className="h-28 w-28 border-4 border-background shadow-xl ring-2 ring-primary/10">
            <AvatarImage src={p.avatar_url || undefined} />
            <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
              {(p.organization_name || p.full_name)?.[0] ?? "؟"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 pt-2 sm:pt-8 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{p.organization_name || p.full_name}</h1>
              {p.is_verified && (
                <Badge className="bg-primary/10 text-primary border-primary/30 gap-1">
                  <CheckCircle className="h-3 w-3" /> موثّق
                </Badge>
              )}
              {role.data && (
                <Badge variant="secondary">{roleLabels[role.data] ?? role.data}</Badge>
              )}
            </div>

            {p.organization_name && (
              <p className="text-sm text-muted-foreground">{p.full_name}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {avgRating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-warning fill-warning" />
                  <strong className="text-foreground">{avgRating.toFixed(1)}</strong>
                  ({r.length} تقييم)
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" /> {views} مشاهدة
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className="h-4 w-4" /> {savesCount.data ?? 0} حفظ
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <Button
                variant={isSaved ? "default" : "outline"}
                size="sm"
                onClick={toggleSave}
                className="transition-all"
              >
                {isSaved ? <BookmarkCheck className="h-4 w-4 me-1" /> : <Bookmark className="h-4 w-4 me-1" />}
                {isSaved ? "تم الحفظ" : "حفظ الملف"}
              </Button>
              {showSupportButton && (
                <Button
                  size="sm"
                  onClick={() => navigate(`/donations?association_id=${id}`)}
                  className="gap-1.5"
                >
                  <Heart className="h-4 w-4" /> دعم هذه الجمعية
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-8 mt-8">
        <Tabs defaultValue="about" dir="rtl">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap scrollbar-hide bg-muted/50 h-auto p-1 gap-1 rounded-xl">
            <TabsTrigger value="about" className="gap-1.5 rounded-lg"><UserIcon className="h-4 w-4" /> نبذة</TabsTrigger>
            {!isAssociation && skills.length > 0 && (
              <TabsTrigger value="skills" className="gap-1.5 rounded-lg"><Award className="h-4 w-4" /> المهارات</TabsTrigger>
            )}
            {isAssociation ? (
              <TabsTrigger value="projects" className="gap-1.5 rounded-lg"><FileText className="h-4 w-4" /> الطلبات</TabsTrigger>
            ) : (
              <TabsTrigger value="services" className="gap-1.5 rounded-lg"><Briefcase className="h-4 w-4" /> الخدمات</TabsTrigger>
            )}
            {!isAssociation && (
              <TabsTrigger value="portfolio" className="gap-1.5 rounded-lg"><ImageIcon className="h-4 w-4" /> الأعمال</TabsTrigger>
            )}
            {!isAssociation && qualifications.length > 0 && (
              <TabsTrigger value="qualifications" className="gap-1.5 rounded-lg"><GraduationCap className="h-4 w-4" /> المؤهلات</TabsTrigger>
            )}
            <TabsTrigger value="ratings" className="gap-1.5 rounded-lg"><MessageSquare className="h-4 w-4" /> التقييمات</TabsTrigger>
          </TabsList>

          {/* About */}
          <TabsContent value="about" className="mt-6 animate-in fade-in-50 duration-300">
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.bio || "لا يوجد وصف تعريفي بعد."}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills (provider only) */}
          {!isAssociation && (
            <TabsContent value="skills" className="mt-6 animate-in fade-in-50 duration-300">
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-sm px-3 py-1.5">{skill}</Badge>
                ))}
              </div>
            </TabsContent>
          )}

          {/* Projects (association only) */}
          {isAssociation && (
            <TabsContent value="projects" className="mt-6 animate-in fade-in-50 duration-300">
              {projects.data?.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.data.map((proj: any) => (
                    <Card
                      key={proj.id}
                      className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group"
                      onClick={() => navigate(`/projects/public/${proj.id}`)}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm line-clamp-2">{proj.title}</h3>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {statusLabels[proj.status] ?? proj.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{proj.description}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {proj.categories?.name && (
                            <Badge variant="outline" className="text-xs">{proj.categories.name}</Badge>
                          )}
                          {proj.budget && (
                            <span className="text-primary font-semibold">
                              {Number(proj.budget).toLocaleString()} ر.س
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(proj.created_at), "dd/MM/yyyy")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">لا توجد طلبات</p>
              )}
            </TabsContent>
          )}

          {/* Services (provider only) */}
          {!isAssociation && (
            <TabsContent value="services" className="mt-6 animate-in fade-in-50 duration-300">
              {services.data?.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {services.data.map((s: any) => (
                    <Card key={s.id} className="overflow-hidden hover:shadow-md transition-all duration-200 group">
                      {s.image_url && (
                        <div className="h-40 overflow-hidden">
                          <img src={s.image_url} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        </div>
                      )}
                      <CardContent className="p-4 space-y-2">
                        <h3 className="font-semibold text-sm">{s.title}</h3>
                        {s.categories?.name && <Badge variant="secondary" className="text-xs">{s.categories.name}</Badge>}
                        <p className="text-primary font-bold text-sm">
                          ابتداءً من {Number(s.price).toLocaleString()} ر.س
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">لا توجد خدمات</p>
              )}
            </TabsContent>
          )}

          {/* Portfolio (provider only) */}
          {!isAssociation && (
            <TabsContent value="portfolio" className="mt-6 animate-in fade-in-50 duration-300">
              <PortfolioGrid providerId={id!} />
            </TabsContent>
          )}

          {/* Qualifications (provider only) */}
          {!isAssociation && (
            <TabsContent value="qualifications" className="mt-6 animate-in fade-in-50 duration-300">
              <div className="space-y-3">
                {qualifications.map((q, i) => (
                  <Card key={i} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <GraduationCap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-semibold text-sm">{q.title}</h4>
                          {q.description && <p className="text-xs text-muted-foreground mt-1">{q.description}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          {/* Ratings */}
          <TabsContent value="ratings" className="mt-6 animate-in fade-in-50 duration-300">
            {r.length ? (
              <div className="space-y-4">
                <Card className="shadow-sm">
                  <CardContent className="p-5">
                    <RatingDistribution ratings={r} />
                  </CardContent>
                </Card>
                <div className="space-y-3">
                  {r.map((rt: any) => {
                    const avg = (rt.quality_score + rt.timing_score + rt.communication_score) / 3;
                    return (
                      <Card key={rt.id} className="shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={rt.profiles?.avatar_url || undefined} />
                              <AvatarFallback>{rt.profiles?.full_name?.[0] ?? "؟"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{rt.profiles?.full_name ?? "مستخدم"}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(rt.created_at), "dd MMMM yyyy", { locale: ar })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <StarRating value={Math.round(avg)} readonly size="sm" />
                              <span className="text-sm font-semibold">{avg.toFixed(1)}</span>
                            </div>
                          </div>
                          {rt.comment && <p className="text-sm text-muted-foreground border-t pt-2 mt-1">{rt.comment}</p>}
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>الجودة: {rt.quality_score}/5</span>
                            <span>الالتزام: {rt.timing_score}/5</span>
                            <span>التواصل: {rt.communication_score}/5</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">لا توجد تقييمات بعد</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
