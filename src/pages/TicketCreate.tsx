import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { TicketForm } from "@/components/tickets/TicketForm";
import { useCreateTicket } from "@/hooks/useSupportTickets";
import { useUploadAttachment } from "@/hooks/useAttachments";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/attachments/FileUploader";
import { AttachmentList } from "@/components/attachments/AttachmentList";
import { Upload } from "lucide-react";
import { getFriendlyDatabaseError } from "@/lib/db-errors";

export default function TicketCreate() {
  const createTicket = useCreateTicket();
  const navigate = useNavigate();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const uploadAttachment = useUploadAttachment();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (values: { subject: string; description: string; priority: "low" | "medium" | "high" | "urgent" }) => {
    try {
      const result = await createTicket.mutateAsync(values);
      const newId = (result as any)?.id;
      if (newId) {
        // Upload pending files
        for (const file of pendingFiles) {
          uploadAttachment.mutate({ file, entityType: "ticket", entityId: newId });
        }
        setTicketId(newId);
        toast.success("تم إنشاء التذكرة بنجاح — يمكنك إرفاق ملفات إضافية");
      } else {
        toast.success("تم إنشاء التذكرة بنجاح");
        navigate("/tickets");
      }
    } catch (error) {
      toast.error(getFriendlyDatabaseError(error, "حدث خطأ أثناء إنشاء التذكرة"));
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    setPendingFiles(prev => [...prev, ...Array.from(files)]);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
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
          <CardContent className="space-y-4">
            <TicketForm onSubmit={handleSubmit} isLoading={createTicket.isPending}>
              {/* Inline file staging area */}
              <div className="space-y-3">
                <label className="text-sm font-medium">المرفقات</label>
                <div
                  onClick={() => inputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-border hover:border-primary/50 hover:bg-muted/50"
                >
                  <Upload className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">اسحب الملفات أو اضغط لاختيار ملف</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, صور, Word, Excel — حتى 10 MB</p>
                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </div>
                {pendingFiles.length > 0 && (
                  <div className="space-y-1.5">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 text-sm">
                        <span className="truncate">{f.name}</span>
                        <button type="button" onClick={() => removePendingFile(i)} className="text-destructive text-xs hover:underline shrink-0 ms-2">إزالة</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TicketForm>
          </CardContent>
        </Card>

        {ticketId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">إرفاق ملفات إضافية</CardTitle>
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
