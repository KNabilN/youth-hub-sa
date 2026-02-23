import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base truncate">{service.title}</CardTitle>
          <Badge variant="outline">{typeLabel[service.service_type] || service.service_type}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{service.profiles?.full_name}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-primary">{service.price} ر.س</span>
          <div className="flex gap-1.5">
            {service.categories?.name && <Badge variant="secondary" className="text-xs">{service.categories.name}</Badge>}
            {service.regions?.name && <Badge variant="secondary" className="text-xs">{service.regions.name}</Badge>}
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full">طلب الخدمة</Button>
      </CardContent>
    </Card>
  );
}
