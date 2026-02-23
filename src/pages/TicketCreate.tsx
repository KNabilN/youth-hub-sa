import { DashboardLayout } from "@/components/DashboardLayout";
import { TicketForm } from "@/components/tickets/TicketForm";
import { useCreateTicket } from "@/hooks/useSupportTickets";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TicketCreate() {
  const createTicket = useCreateTicket();
  const navigate = useNavigate();

  const handleSubmit = async (values: { subject: string; description: string; priority: "low" | "medium" | "high" | "urgent" }) => {
    try {
      await createTicket.mutateAsync(values);
      toast.success("تم إنشاء التذكرة بنجاح");
      navigate("/tickets");
    } catch {
      toast.error("حدث خطأ أثناء إنشاء التذكرة");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">تذكرة دعم جديدة</h1>
          <p className="text-muted-foreground text-sm mt-1">أخبرنا بالمشكلة وسنساعدك</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">تفاصيل التذكرة</CardTitle>
          </CardHeader>
          <CardContent>
            <TicketForm onSubmit={handleSubmit} isLoading={createTicket.isPending} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
