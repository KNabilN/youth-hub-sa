import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, DollarSign, CheckCircle, Briefcase, MessageSquare, User } from "lucide-react";

export default function ProviderProfile() {
  const { id } = useParams<{ id: string }>();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["provider-profile", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: services } = useQuery({
    queryKey: ["provider-services", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_services")
        .select("*, categories(name)")
        .eq("provider_id", id!)
        .eq("approval", "approved");
      if (error) throw error;
      return data;
    },
  });

  const { data: contracts } = useQuery({
    queryKey: ["provider-contracts", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id")
        .eq("provider_id", id!);
      if (error) throw error;
      return data;
    },
  });

  const { data: ratingsData } = useQuery({
    queryKey: ["provider-ratings", id],
    enabled: !!contracts && contracts.length > 0,
    queryFn: async () => {
      const contractIds = contracts!.map(c => c.id);
      const { data, error } = await supabase
        .from("ratings")
        .select("*, profiles:rater_id(full_name, avatar_url)")
        .in("contract_id", contractIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const avgRating = ratingsData?.length
    ? (ratingsData.reduce((s, r) => s + (r.quality_score + r.timing_score + r.communication_score) / 3, 0) / ratingsData.length).toFixed(1)
    : null;

  const completedCount = contracts?.length ?? 0;
  const reviewCount = ratingsData?.length ?? 0;

  if (isLoading) return <DashboardLayout><Skeleton className="h-96" /></DashboardLayout>;
  if (!profile) return <DashboardLayout><p className="text-center py-12 text-muted-foreground">لم يتم العثور على الملف الشخصي</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Styled Page Header */}
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">الملف الشخصي لمزود الخدمة</h1>
            <p className="text-sm text-muted-foreground">تفاصيل وخدمات وتقييمات المزود</p>
          </div>
        </div>

        {/* Gradient Divider */}
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">{profile.full_name?.[0] ?? "؟"}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {profile.full_name}
                  {profile.is_verified && <CheckCircle className="h-4 w-4 text-primary" />}
                </h2>
                {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
                <div className="flex items-center gap-3 mt-1">
                  {avgRating && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-warning text-warning" /> {avgRating}
                    </Badge>
                  )}
                  {profile.hourly_rate && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> {profile.hourly_rate} ر.س/ساعة
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
              <Briefcase className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{completedCount}</span>
              <span className="text-xs text-muted-foreground">عقود</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{reviewCount}</span>
              <span className="text-xs text-muted-foreground">تقييمات</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 flex flex-col items-center gap-1">
              <Star className="h-5 w-5 text-warning" />
              <span className="text-2xl font-bold">{avgRating ?? "—"}</span>
              <span className="text-xs text-muted-foreground">متوسط التقييم</span>
            </CardContent>
          </Card>
        </div>

        {/* Services Section */}
        <div>
          <h2 className="text-lg font-semibold mb-3">الخدمات</h2>
          {services?.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((s: any) => (
                <Card key={s.id}>
                  <CardContent className="p-4 space-y-1">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-semibold text-primary">{s.price} ر.س</span>
                      {s.categories?.name && <Badge variant="secondary" className="text-xs">{s.categories.name}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center py-6 text-muted-foreground">لا توجد خدمات</p>
          )}
        </div>

        {/* Reviews Section */}
        <div>
          <h2 className="text-lg font-semibold mb-3">التقييمات</h2>
          {ratingsData?.length ? (
            <div className="space-y-3">
              {ratingsData.map((r: any) => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={r.profiles?.avatar_url || undefined} />
                        <AvatarFallback>{r.profiles?.full_name?.[0] ?? "؟"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{r.profiles?.full_name ?? "مستخدم"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ar-SA")}</p>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        {((r.quality_score + r.timing_score + r.communication_score) / 3).toFixed(1)}
                      </Badge>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>الجودة: {r.quality_score}/5</span>
                      <span>الالتزام: {r.timing_score}/5</span>
                      <span>التواصل: {r.communication_score}/5</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center py-6 text-muted-foreground">لا توجد تقييمات بعد</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
