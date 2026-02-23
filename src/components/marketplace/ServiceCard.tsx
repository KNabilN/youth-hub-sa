import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { usePurchaseService } from "@/hooks/usePurchaseService";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Service = Tables<"micro_services"> & {
  categories: Tables<"categories"> | null;
  regions: Tables<"regions"> | null;
  profiles: { full_name: string } | null;
};

const typeLabel: Record<string, string> = {
  fixed_price: "سعر ثابت",
  hourly: "بالساعة",
};

export function ServiceCard({ service }: { service: Service }) {
  const { user, role } = useAuth();
  const purchase = usePurchaseService();
  const [showDialog, setShowDialog] = useState(false);

  const canPurchase = role === "youth_association" || role === "donor";

  const handlePurchase = () => {
    if (!user) return;
    purchase.mutate(
      { serviceId: service.id, providerId: service.provider_id, buyerId: user.id, amount: service.price },
      {
        onSuccess: () => { toast.success("تم شراء الخدمة بنجاح"); setShowDialog(false); },
        onError: () => toast.error("حدث خطأ أثناء الشراء"),
      }
    );
  };

  return (
    <>
      <Card className="card-hover group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base truncate">{service.title}</CardTitle>
            <Badge variant="outline" className="shrink-0">{typeLabel[service.service_type] || service.service_type}</Badge>
          </div>
          <Link to={`/providers/${service.provider_id}`} className="flex items-center gap-2 mt-1 hover:opacity-80 transition-opacity">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                {service.profiles?.full_name?.[0] || "؟"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground hover:underline">{service.profiles?.full_name}</span>
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
          <div className="flex items-center justify-between text-sm">
            <div className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg text-sm">
              {service.price.toLocaleString()} ر.س
            </div>
            <div className="flex gap-1.5">
              {service.categories?.name && <Badge variant="secondary" className="text-xs">{service.categories.name}</Badge>}
              {service.regions?.name && <Badge variant="secondary" className="text-xs">{service.regions.name}</Badge>}
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" onClick={() => canPurchase ? setShowDialog(true) : null} disabled={!canPurchase}>
            {canPurchase ? "طلب الخدمة" : "طلب الخدمة"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد شراء الخدمة</DialogTitle>
            <DialogDescription>سيتم حجز المبلغ حتى إتمام الخدمة</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <p className="font-medium">{service.title}</p>
            <p className="text-sm text-muted-foreground">{service.profiles?.full_name}</p>
            <p className="text-lg font-bold text-primary">{service.price.toLocaleString()} ر.س</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handlePurchase} disabled={purchase.isPending}>
              {purchase.isPending ? "جارٍ الشراء..." : "تأكيد الشراء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
