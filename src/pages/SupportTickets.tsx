import { DashboardLayout } from "@/components/DashboardLayout";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { TicketCard } from "@/components/tickets/TicketCard";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SupportTickets() {
  const { data: tickets, isLoading } = useSupportTickets();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">الدعم الفني</h1>
            <p className="text-muted-foreground text-sm mt-1">تذاكر الدعم الخاصة بك</p>
          </div>
          <Button onClick={() => navigate("/tickets/new")}>
            <Plus className="ml-2 h-4 w-4" />
            تذكرة جديدة
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : !tickets?.length ? (
          <EmptyState icon={MessageSquare} title="لا توجد تذاكر دعم" description="يمكنك إنشاء تذكرة جديدة للتواصل مع فريق الدعم" actionLabel="تذكرة جديدة" actionHref="/tickets/new" />
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <TicketCard
                key={t.id}
                subject={t.subject}
                description={t.description}
                status={t.status}
                priority={t.priority}
                created_at={t.created_at}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
