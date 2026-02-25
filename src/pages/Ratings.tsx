import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Star, Send, X } from "lucide-react";
import { StarRating } from "@/components/ratings/StarRating";

export default function Ratings() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const isProvider = role === "service_provider";

  const { data: contracts, isLoading } = useQuery({
    queryKey: ["ratable-contracts", user?.id, role],
    enabled: !!user,
    queryFn: async () => {
      if (isProvider) {
        const { data, error } = await supabase
          .from("contracts")
          .select("*, projects(title, status), profiles:association_id(full_name, avatar_url)")
          .eq("provider_id", user!.id);
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("contracts")
          .select("*, projects(title, status), profiles:provider_id(full_name, avatar_url)")
          .eq("association_id", user!.id);
        if (error) throw error;
        return data;
      }
    },
  });

  const { data: existingRatings } = useQuery({
    queryKey: ["my-ratings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("ratings").select("*").eq("rater_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const ratedContractIds = new Set(existingRatings?.map(r => r.contract_id) ?? []);

  const submitRating = useMutation({
    mutationFn: async (vals: { contract_id: string; quality_score: number; timing_score: number; communication_score: number; comment: string }) => {
      const { error } = await supabase.from("ratings").insert({ ...vals, rater_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-ratings"] });
      qc.invalidateQueries({ queryKey: ["pending-ratings"] });
      toast({ title: "تم إرسال التقييم بنجاح ✨" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const [activeContract, setActiveContract] = useState<string | null>(null);
  const [quality, setQuality] = useState(0);
  const [timing, setTiming] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!activeContract || quality === 0 || timing === 0 || communication === 0) {
      toast({ title: "يرجى تقييم جميع المعايير", variant: "destructive" });
      return;
    }
    submitRating.mutate({
      contract_id: activeContract,
      quality_score: quality,
      timing_score: timing,
      communication_score: communication,
      comment,
    });
    setActiveContract(null);
    setComment("");
    setQuality(0); setTiming(0); setCommunication(0);
  };

  const openRating = (contractId: string) => {
    setActiveContract(contractId);
    setQuality(0); setTiming(0); setCommunication(0); setComment("");
  };

  if (isLoading) return <DashboardLayout><Skeleton className="h-96" /></DashboardLayout>;

  const unrated = contracts?.filter(c => !ratedContractIds.has(c.id)) ?? [];
  const rated = contracts?.filter(c => ratedContractIds.has(c.id)) ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <Star className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">التقييمات</h1>
            <p className="text-sm text-muted-foreground">
              {isProvider ? "قيّم الجمعيات بعد إتمام العقود" : "قيّم مقدمي الخدمات بعد إتمام العقود"}
            </p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {/* Rating Form */}
        {activeContract && (
          <Card className="border-primary shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">تقييم جديد</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setActiveContract(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: "جودة العمل", value: quality, onChange: setQuality, desc: "مستوى جودة المخرجات والنتائج" },
                { label: "الالتزام بالوقت", value: timing, onChange: setTiming, desc: "الالتزام بالمواعيد المحددة" },
                { label: "التواصل", value: communication, onChange: setCommunication, desc: "مستوى التواصل والاستجابة" },
              ].map(({ label, value, onChange, desc }) => (
                <div key={label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">{label}</Label>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <StarRating value={value} onChange={onChange} size="lg" showValue />
                </div>
              ))}
              <div className="space-y-2">
                <Label>تعليق (اختياري)</Label>
                <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="شارك تجربتك مع الطرف الآخر..." rows={3} />
              </div>
              <Button onClick={handleSubmit} disabled={submitRating.isPending} className="w-full gap-2">
                <Send className="h-4 w-4" />
                إرسال التقييم
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Unrated contracts */}
        {unrated.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">بانتظار التقييم ({unrated.length})</h2>
            {unrated.map(contract => {
              const profile = (contract as any).profiles;
              return (
                <Card key={contract.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback>{profile?.full_name?.[0] ?? "؟"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{(contract as any).projects?.title || "مشروع"}</p>
                        <p className="text-sm text-muted-foreground">{profile?.full_name || (isProvider ? "جمعية" : "مقدم خدمة")}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => openRating(contract.id)} disabled={activeContract === contract.id}>
                      تقييم
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Rated contracts */}
        {rated.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">تقييمات سابقة ({rated.length})</h2>
            {rated.map(contract => {
              const rating = existingRatings?.find(r => r.contract_id === contract.id);
              const profile = (contract as any).profiles;
              const avg = rating ? ((rating.quality_score + rating.timing_score + rating.communication_score) / 3) : 0;
              return (
                <Card key={contract.id} className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback>{profile?.full_name?.[0] ?? "؟"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{(contract as any).projects?.title || "مشروع"}</p>
                          <p className="text-sm text-muted-foreground">{profile?.full_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating value={Math.round(avg)} readonly size="sm" />
                        <Badge variant="secondary">{avg.toFixed(1)}</Badge>
                      </div>
                    </div>
                    {rating?.comment && <p className="text-sm text-muted-foreground mt-2 border-t pt-2">{rating.comment}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>الجودة: {rating?.quality_score}/5</span>
                      <span>الالتزام: {rating?.timing_score}/5</span>
                      <span>التواصل: {rating?.communication_score}/5</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!contracts?.length && <p className="text-center py-8 text-muted-foreground">لا توجد عقود قابلة للتقييم</p>}
      </div>
    </DashboardLayout>
  );
}
