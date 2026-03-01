import { useParams } from "react-router-dom";
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
  CheckCircle, Eye, Bookmark, BookmarkCheck, Star, Award, Briefcase, GraduationCap, MessageSquare, User as UserIcon, ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const roleLabels: Record<string, string> = {
  super_admin: "مدير النظام",
  youth_association: "جمعية شبابية",
  service_provider: "مقدم خدمة",
  donor: "مانح",
};

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const { profile, role, services, portfolio, ratings, savesCount } = usePublicProfile(id);
  const { isSaved, toggle: toggleSave } = useToggleProfileSave(id);

  const p = profile.data;
  const r = ratings.data ?? [];
  const avgRating = r.length
    ? r.reduce((s: number, rt: any) => s + (rt.quality_score + rt.timing_score + rt.communication_score) / 3, 0) / r.length
    : 0;

  const skills: string[] = (p as any)?.skills ?? [];
  const qualifications: { title: string; description?: string }[] = (p as any)?.qualifications ?? [];
  const coverUrl: string = (p as any)?.cover_image_url || "";
  const views: number = (p as any)?.profile_views ?? 0;

  if (profile.isLoading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-40" />
        <p className="text-lg">لم يتم العثور على هذا الملف الشخصي</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto" dir="rtl">
      {/* Cover Image */}
      <div className="relative h-48 sm:h-64 md:h-72 bg-gradient-to-l from-primary/20 via-primary/10 to-accent/10 rounded-b-2xl overflow-hidden">
        {coverUrl && (
          <img src={coverUrl} alt="غلاف" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 sm:px-6 -mt-16 relative z-10">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
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

            <Button
              variant={isSaved ? "default" : "outline"}
              size="sm"
              onClick={toggleSave}
              className="mt-1"
            >
              {isSaved ? <BookmarkCheck className="h-4 w-4 me-1" /> : <Bookmark className="h-4 w-4 me-1" />}
              {isSaved ? "تم الحفظ" : "حفظ الملف"}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-6 mt-8 pb-12">
        <Tabs defaultValue="about" dir="rtl">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-muted/50 h-auto p-1 gap-1">
            <TabsTrigger value="about" className="gap-1"><UserIcon className="h-4 w-4" /> نبذة</TabsTrigger>
            {skills.length > 0 && (
              <TabsTrigger value="skills" className="gap-1"><Award className="h-4 w-4" /> المهارات</TabsTrigger>
            )}
            <TabsTrigger value="services" className="gap-1"><Briefcase className="h-4 w-4" /> الخدمات</TabsTrigger>
            <TabsTrigger value="portfolio" className="gap-1"><ImageIcon className="h-4 w-4" /> الأعمال</TabsTrigger>
            {qualifications.length > 0 && (
              <TabsTrigger value="qualifications" className="gap-1"><GraduationCap className="h-4 w-4" /> المؤهلات</TabsTrigger>
            )}
            <TabsTrigger value="ratings" className="gap-1"><MessageSquare className="h-4 w-4" /> التقييمات</TabsTrigger>
          </TabsList>

          {/* About */}
          <TabsContent value="about" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.bio || "لا يوجد وصف تعريفي بعد."}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills */}
          <TabsContent value="skills" className="mt-6">
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <Badge key={i} variant="secondary" className="text-sm px-3 py-1.5">{skill}</Badge>
              ))}
            </div>
          </TabsContent>

          {/* Services */}
          <TabsContent value="services" className="mt-6">
            {services.data?.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.data.map((s: any) => (
                  <Card key={s.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    {s.image_url && (
                      <div className="h-40 overflow-hidden">
                        <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" loading="lazy" />
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

          {/* Portfolio */}
          <TabsContent value="portfolio" className="mt-6">
            <PortfolioGrid providerId={id!} />
          </TabsContent>

          {/* Qualifications */}
          <TabsContent value="qualifications" className="mt-6">
            <div className="space-y-3">
              {qualifications.map((q, i) => (
                <Card key={i}>
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

          {/* Ratings */}
          <TabsContent value="ratings" className="mt-6">
            {r.length ? (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-5">
                    <RatingDistribution ratings={r} />
                  </CardContent>
                </Card>
                <div className="space-y-3">
                  {r.map((rt: any) => {
                    const avg = (rt.quality_score + rt.timing_score + rt.communication_score) / 3;
                    return (
                      <Card key={rt.id}>
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
