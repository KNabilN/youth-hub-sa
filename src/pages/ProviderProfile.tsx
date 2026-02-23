import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, DollarSign, CheckCircle } from "lucide-react";

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

  const { data: avgRating } = useQuery({
    queryKey: ["provider-rating", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: contracts } = await supabase
        .from("contracts")
        .select("id")
        .eq("provider_id", id!);
      if (!contracts?.length) return null;
      const contractIds = contracts.map(c => c.id);
      const { data: ratings } = await supabase
        .from("ratings")
        .select("quality_score, timing_score, communication_score")
        .in("contract_id", contractIds);
      if (!ratings?.length) return null;
      const total = ratings.reduce((s, r) => s + (r.quality_score + r.timing_score + r.communication_score) / 3, 0);
      return (total / ratings.length).toFixed(1);
    },
  });

  if (isLoading) return <DashboardLayout><Skeleton className="h-96" /></DashboardLayout>;
  if (!profile) return <DashboardLayout><p className="text-center py-12 text-muted-foreground">لم يتم العثور على الملف الشخصي</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">{profile.full_name?.[0] ?? "؟"}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h1 className="text-xl font-bold flex items-center gap-2">
                  {profile.full_name}
                  {profile.is_verified && <CheckCircle className="h-4 w-4 text-primary" />}
                </h1>
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

        <div>
          <h2 className="text-lg font-semibold mb-3">الخدمات</h2>
          {services?.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map(s => (
                <Card key={s.id}>
                  <CardContent className="p-4 space-y-1">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-semibold text-primary">{s.price} ر.س</span>
                      {(s as any).categories?.name && <Badge variant="secondary" className="text-xs">{(s as any).categories.name}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center py-6 text-muted-foreground">لا توجد خدمات</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
