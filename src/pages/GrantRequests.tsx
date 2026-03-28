import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useGrantRequestsForDonor } from "@/hooks/useGrantRequests";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HandCoins, Search, Users, Target, AlertTriangle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVerificationGuard } from "@/hooks/useVerificationGuard";
import { EmptyState } from "@/components/EmptyState";
import { ContentSkeleton } from "@/components/ContentSkeleton";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const urgencyMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  normal: { label: "عادي", variant: "outline" },
  medium: { label: "متوسط", variant: "secondary" },
  urgent: { label: "عاجل", variant: "destructive" },
};

export default function GrantRequests() {
  const { data: requests, isLoading } = useGrantRequestsForDonor();
  const navigate = useNavigate();
  const { isVerified, guardAction } = useVerificationGuard();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = requests?.filter(r => {
    const matchesSearch = !search.trim() ||
      r.association?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.association?.organization_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.purpose?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDonate = (req: any) => {
    guardAction(() => {
      const params = new URLSearchParams();
      params.set("grant_request_id", req.id);
      params.set("association_id", req.association_id);
      params.set("amount", String(req.amount));
      if (req.project_id) params.set("project_id", req.project_id);
      navigate(`/donations?${params.toString()}`);
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <HandCoins className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">طلبات الدعم</h1>
            <p className="text-sm text-muted-foreground">طلبات الجمعيات التي تحتاج إلى دعم</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative max-w-md flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="ابحث بالجمعية أو الوصف..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="pending">بانتظار المراجعة</SelectItem>
              <SelectItem value="approved">تمت الموافقة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? <ContentSkeleton /> : !filtered?.length ? (
          <EmptyState icon={HandCoins} title="لا توجد طلبات" description="لا توجد طلبات دعم حالياً" />
        ) : (
          <div className="grid gap-4">
            {filtered.map(req => {
              const urg = urgencyMap[req.urgency] || urgencyMap.normal;
              return (
                <Card key={req.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 shrink-0 cursor-pointer" onClick={() => navigate(`/profile/${req.association_id}`)}>
                        <AvatarImage src={req.association?.avatar_url || undefined} />
                        <AvatarFallback>{req.association?.full_name?.[0] || "؟"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{req.association?.organization_name || req.association?.full_name}</p>
                          {req.donor_id && <Badge variant="secondary">طلب موجه لك</Badge>}
                          {req.project?.title && <Badge variant="outline">مشروع: {req.project.title}</Badge>}
                          {req.urgency && req.urgency !== "normal" && (
                            <Badge variant={urg.variant}>
                              <AlertTriangle className="h-3 w-3 me-1" />
                              {urg.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-lg font-bold text-primary">{Number(req.amount).toLocaleString()} ر.س</p>
                        
                        {req.purpose && (
                          <div className="flex items-start gap-2 text-sm">
                            <Target className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <span><span className="font-medium">الهدف:</span> {req.purpose}</span>
                          </div>
                        )}
                        {req.target_group && (
                          <div className="flex items-start gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <span><span className="font-medium">الفئة المستهدفة:</span> {req.target_group}</span>
                          </div>
                        )}
                        {req.beneficiaries_count && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span>عدد المستفيدين المتوقع: <span className="font-semibold text-foreground">{req.beneficiaries_count.toLocaleString()}</span></span>
                          </div>
                        )}
                        {req.description && <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>}
                        
                        <div className="flex items-center gap-3 pt-1">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(req.created_at), "d MMM yyyy", { locale: ar })}
                          </p>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => navigate(`/profile/${req.association_id}`)}>
                            <ExternalLink className="h-3 w-3 me-1" />
                            عرض بروفايل الجمعية
                          </Button>
                        </div>
                      </div>
                      <Button onClick={() => handleDonate(req)} className="shrink-0">
                        <HandCoins className="h-4 w-4 me-2" /> تبرع
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
