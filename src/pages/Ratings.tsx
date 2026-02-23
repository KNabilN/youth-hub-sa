import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Star } from "lucide-react";

export default function Ratings() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Contracts eligible for rating (completed projects where user is association)
  const { data: contracts, isLoading } = useQuery({
    queryKey: ["ratable-contracts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*, projects(title, status), profiles:provider_id(full_name)")
        .eq("association_id", user!.id);
      if (error) throw error;
      return data;
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
      toast({ title: "تم إرسال التقييم" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const [activeContract, setActiveContract] = useState<string | null>(null);
  const [quality, setQuality] = useState(3);
  const [timing, setTiming] = useState(3);
  const [communication, setCommunication] = useState(3);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!activeContract) return;
    submitRating.mutate({
      contract_id: activeContract,
      quality_score: quality,
      timing_score: timing,
      communication_score: communication,
      comment,
    });
    setActiveContract(null);
    setComment("");
    setQuality(3); setTiming(3); setCommunication(3);
  };

  if (isLoading) return <DashboardLayout><Skeleton className="h-96" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">التقييمات</h1>
          <p className="text-sm text-muted-foreground mt-1">قيّم مقدمي الخدمات بعد إتمام العقود</p>
        </div>

        {activeContract && (
          <Card className="border-primary">
            <CardHeader><CardTitle className="text-lg">تقييم جديد</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {[
                { label: "جودة العمل", value: quality, onChange: setQuality },
                { label: "الالتزام بالوقت", value: timing, onChange: setTiming },
                { label: "التواصل", value: communication, onChange: setCommunication },
              ].map(({ label, value, onChange }) => (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>{label}</Label>
                    <span className="font-medium">{value}/5</span>
                  </div>
                  <Slider min={1} max={5} step={1} value={[value]} onValueChange={([v]) => onChange(v)} />
                </div>
              ))}
              <div className="space-y-2">
                <Label>تعليق (اختياري)</Label>
                <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="أضف تعليقاً..." rows={3} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={submitRating.isPending}>إرسال التقييم</Button>
                <Button variant="outline" onClick={() => setActiveContract(null)}>إلغاء</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {contracts?.map(contract => {
            const isRated = ratedContractIds.has(contract.id);
            const rating = existingRatings?.find(r => r.contract_id === contract.id);
            return (
              <Card key={contract.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{(contract as any).projects?.title || "مشروع"}</p>
                    <p className="text-sm text-muted-foreground">{(contract as any).profiles?.full_name || "مقدم خدمة"}</p>
                  </div>
                  {isRated && rating ? (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-warning fill-warning" />
                      <span className="text-sm font-medium">
                        {((rating.quality_score + rating.timing_score + rating.communication_score) / 3).toFixed(1)}
                      </span>
                      <Badge variant="secondary">تم التقييم</Badge>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => setActiveContract(contract.id)} disabled={activeContract === contract.id}>
                      تقييم
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {!contracts?.length && <p className="text-center py-8 text-muted-foreground">لا توجد عقود قابلة للتقييم</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
