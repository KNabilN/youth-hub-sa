import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Ticket, FileText } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { TicketReplyThread } from "@/components/tickets/TicketReplyThread";
import type { Database } from "@/integrations/supabase/types";

type TicketStatus = Database["public"]["Enums"]["ticket_status"];
type TicketPriority = Database["public"]["Enums"]["ticket_priority"];

const statusLabels: Record<TicketStatus, string> = {
  open: "مفتوحة", in_progress: "قيد المعالجة", resolved: "تم الحل", closed: "مغلقة",
};
const statusColors: Record<TicketStatus, string> = {
  open: "bg-blue-500/10 text-blue-700 border-blue-200",
  in_progress: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  resolved: "bg-green-500/10 text-green-700 border-green-200",
  closed: "bg-muted text-muted-foreground",
};
const priorityLabels: Record<TicketPriority, string> = {
  low: "منخفضة", medium: "متوسطة", high: "عالية", urgent: "عاجلة",
};
const priorityColors: Record<TicketPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/10 text-blue-700",
  high: "bg-orange-500/10 text-orange-700",
  urgent: "bg-destructive/10 text-destructive",
};

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-3xl mx-auto">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">لم يتم العثور على التذكرة</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/tickets")}>
            <ArrowRight className="h-4 w-4 ms-2" /> العودة
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-3">
              <Ticket className="h-7 w-7 text-primary" />
            </div>
            <div>
              {ticket.ticket_number && (
                <span className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</span>
              )}
              <h1 className="text-xl font-bold">{ticket.subject}</h1>
            </div>
          </div>
          <Button variant="ghost" onClick={() => navigate("/tickets")} className="gap-2">
            العودة
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Status & Priority */}
        <div className="flex gap-2">
          <Badge variant="outline" className={statusColors[ticket.status as TicketStatus]}>
            {statusLabels[ticket.status as TicketStatus]}
          </Badge>
          <Badge variant="outline" className={priorityColors[ticket.priority as TicketPriority]}>
            {priorityLabels[ticket.priority as TicketPriority]}
          </Badge>
          <span className="text-xs text-muted-foreground self-center">
            {format(new Date(ticket.created_at), "yyyy/MM/dd", { locale: ar })}
          </span>
        </div>

        {/* Description */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> وصف التذكرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
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
