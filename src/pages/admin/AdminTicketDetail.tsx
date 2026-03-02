import { useParams, useNavigate } from "react-router-dom";
import { useAdminTicketById } from "@/hooks/useAdminTicketById";
import { useUpdateTicketStatus } from "@/hooks/useAdminTickets";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowRight,
  Ticket,
  User,
  AlertTriangle,
  Activity,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import { TicketReplyThread } from "@/components/tickets/TicketReplyThread";
import type { Database } from "@/integrations/supabase/types";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];

const statusLabels: Record<string, string> = {
  open: "مفتوحة",
  in_progress: "قيد المعالجة",
  resolved: "تم الحل",
  closed: "مغلقة",
};

const priorityLabels: Record<string, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
};

const statusColors: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  in_progress: "bg-yellow-500/10 text-yellow-600",
  resolved: "bg-emerald-500/10 text-emerald-600",
  closed: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-yellow-500/10 text-yellow-600",
  high: "bg-orange-500/10 text-orange-600",
  urgent: "bg-destructive/10 text-destructive",
};

function InfoField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: any }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border bg-card text-start">
      <div className="mt-0.5 p-2.5 rounded-lg bg-primary/10 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
        <p className="text-sm font-bold text-foreground leading-relaxed">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function AdminTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: ticket, isLoading } = useAdminTicketById(id ?? null);
  const updateStatus = useUpdateTicketStatus();

  const handleStatusChange = (status: TicketStatus) => {
    if (!id) return;
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => toast.success("تم تحديث حالة التذكرة"),
        onError: () => toast.error("حدث خطأ"),
      },
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="space-y-4 w-full max-w-lg">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">لم يتم العثور على التذكرة</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/tickets")}>
            <ArrowRight className="h-4 w-4 ms-2" />
            العودة
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b mb-6">
        <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
          <div className="flex gap-2 items-center">
            <Select value={ticket.status} onValueChange={(v) => handleStatusChange(v as TicketStatus)}>
              <SelectTrigger className="w-44 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" onClick={() => navigate("/admin/tickets")} className="gap-2">
            العودة للتذاكر
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12 space-y-6">
        {/* Hero Section */}
        <div className="rounded-2xl bg-gradient-to-l from-primary/5 via-primary/[0.02] to-background border p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-xl bg-primary/10">
              <Ticket className="h-8 w-8 text-primary" />
            </div>
             <div>
               {(ticket as any).ticket_number && (
                 <span className="text-sm font-mono text-muted-foreground mb-1 block">{(ticket as any).ticket_number}</span>
               )}
               <h1 className="text-2xl font-bold text-foreground mb-3">{ticket.subject}</h1>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge className={`${statusColors[ticket.status]} text-sm px-3 py-1`}>
                  {statusLabels[ticket.status]}
                </Badge>
                <Badge className={`${priorityColors[ticket.priority]} text-sm px-3 py-1`}>
                  {priorityLabels[ticket.priority]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {(ticket as any).profiles?.full_name ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(ticket.created_at), "yyyy/MM/dd", { locale: ar })}
              </p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoField icon={User} label="المستخدم" value={(ticket as any).profiles?.full_name} />
          <InfoField icon={AlertTriangle} label="الأولوية" value={priorityLabels[ticket.priority]} />
          <InfoField icon={Activity} label="الحالة" value={statusLabels[ticket.status]} />
          <InfoField
            icon={Calendar}
            label="تاريخ الإنشاء"
            value={format(new Date(ticket.created_at), "yyyy/MM/dd HH:mm", { locale: ar })}
          />
          <InfoField
            icon={Clock}
            label="آخر تحديث"
            value={format(new Date(ticket.updated_at), "yyyy/MM/dd HH:mm", { locale: ar })}
          />
        </div>

        {/* Description Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              وصف التذكرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {ticket.description || "لا يوجد وصف"}
            </p>
          </CardContent>
        </Card>

        {/* Reply Thread */}
        <TicketReplyThread ticketId={ticket.id} ticketStatus={ticket.status} />
      </div>
    </DashboardLayout>
  );
}
