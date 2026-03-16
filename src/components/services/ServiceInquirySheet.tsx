import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageCircleQuestion } from "lucide-react";
import { useServiceInquiry, useCreateInquiry } from "@/hooks/useServiceInquiry";
import { ServiceInquiryChat } from "./ServiceInquiryChat";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface ServiceInquirySheetProps {
  serviceId: string;
  providerId: string;
  serviceTitle: string;
}

export function ServiceInquirySheet({ serviceId, providerId, serviceTitle }: ServiceInquirySheetProps) {
  const [open, setOpen] = useState(false);
  const { data: inquiry, isLoading } = useServiceInquiry(open ? serviceId : undefined);
  const createInquiry = useCreateInquiry();
  const [createdInquiry, setCreatedInquiry] = useState<string | null>(null);

  const inquiryId = inquiry?.id ?? createdInquiry;

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !inquiry && !createdInquiry) {
      try {
        const result = await createInquiry.mutateAsync({ serviceId, providerId });
        setCreatedInquiry(result.id);
      } catch {
        toast.error("تعذر فتح الاستفسار");
        setOpen(false);
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <MessageCircleQuestion className="h-4 w-4" />
          استفسار عن الخدمة
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-start">استفسار عن: {serviceTitle}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0">
          {isLoading || createInquiry.isPending ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-12 w-1/2 ms-auto" />
              <Skeleton className="h-12 w-2/3" />
            </div>
          ) : inquiryId ? (
            <ServiceInquiryChat inquiryId={inquiryId} />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
