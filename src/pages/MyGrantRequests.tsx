import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useMyGrantRequests } from "@/hooks/useGrantRequests";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HandCoins, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { ContentSkeleton } from "@/components/ContentSkeleton";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "بانتظار المراجعة", variant: "secondary" },
  approved: { label: "تمت الموافقة", variant: "default" },
  rejected: { label: "مرفوض", variant: "destructive" },
  funded: { label: "تم التمويل", variant: "default" },
};

export default function MyGrantRequests() {
  const { data: requests, isLoading } = useMyGrantRequests();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = requests?.filter(r =>
    statusFilter === "all" || r.status === statusFilter
  );

  const handleDonate = (req: any) => {
    const params = new URLSearchParams();
    params.set("grant_request_id", req.id);
    params.set("association_id", req.association_id);
    params.set("amount", String(req.amount));
    if (req.project_id) params.set("project_id", req.project_id);
    navigate(`/donations?${params.toString()}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-xl p-3">
            <Inbox className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">طلبات واردة</h1>
            <p className="text-sm text-muted-foreground">طلبات المنح الموجهة لك من الجمعيات</p>
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="فلتر الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="pending">بانتظار المراجعة</SelectItem>
            <SelectItem value="approved">تمت الموافقة</SelectItem>
            <SelectItem value="funded">تم التمويل</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
          </SelectContent>
        </Select>

        {isLoading ? <ContentSkeleton /> : !filtered?.length ? (
          <EmptyState icon={Inbox} title="لا توجد طلبات واردة" description="لم يتم توجيه أي طلبات منح لك حالياً" />
        ) : (
          <div className="grid gap-4">
            {filtered.map(req => {
              const st = statusMap[req.status] || statusMap.pending;
              return (
                <Card key={req.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={req.association?.avatar_url || undefined} />
                        <AvatarFallback>{req.association?.full_name?.[0] || "؟"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{req.association?.organization_name || req.association?.full_name}</p>
                          <Badge variant={st.variant}>{st.label}</Badge>
                          {req.project?.title && <Badge variant="outline">مشروع: {req.project.title}</Badge>}
                        </div>
                        <p className="text-lg font-bold text-primary">{Number(req.amount).toLocaleString()} ر.س</p>
                        {req.description && <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(req.created_at), "d MMM yyyy", { locale: ar })}
                        </p>
                      </div>
                      {(req.status === "pending" || req.status === "approved") && (
                        <Button onClick={() => handleDonate(req)} className="shrink-0">
                          <HandCoins className="h-4 w-4 me-2" /> تبرع
                        </Button>
                      )}
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
