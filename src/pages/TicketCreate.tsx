import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TicketForm } from "@/components/tickets/TicketForm";
import { useCreateTicket } from "@/hooks/useSupportTickets";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/attachments/FileUploader";
import { AttachmentList } from "@/components/attachments/AttachmentList";

export default function TicketCreate() {
  const createTicket = useCreateTicket();
  const navigate = useNavigate();
  const [ticketId, setTicketId] = useState<string | null>(null);

  const handleSubmit = async (values: { subject: string; description: string; priority: "low" | "medium" | "high" | "urgent" }) => {
    try {
      const result = await createTicket.mutateAsync(values);
      const newId = (result as any)?.id;
      if (newId) {
        setTicketId(newId);
        toast.success("تم إنشاء التذكرة بنجاح — يمكنك الآن إرفاق ملفات");
      } else {
        toast.success("تم إنشاء التذكرة بنجاح");
        navigate("/tickets");
      }
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

        {ticketId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إرفاق ملفات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploader entityType="ticket" entityId={ticketId} />
              <AttachmentList entityType="ticket" entityId={ticketId} />
              <div className="flex justify-end">
                <button
                  onClick={() => navigate("/tickets")}
                  className="text-sm text-primary hover:underline"
                >
                  الانتقال لصفحة التذاكر ←
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
