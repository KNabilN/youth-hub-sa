import { DashboardLayout } from "@/components/DashboardLayout";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { TicketCard } from "@/components/tickets/TicketCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
          <p className="text-muted-foreground text-sm">جاري التحميل...</p>
        ) : !tickets?.length ? (
          <p className="text-muted-foreground text-sm">لا توجد تذاكر دعم</p>
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
