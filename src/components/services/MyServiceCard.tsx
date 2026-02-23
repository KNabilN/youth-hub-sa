import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

const approvalLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive"; border: string }> = {
  pending: { label: "قيد المراجعة", variant: "secondary", border: "border-t-4 border-yellow-500" },
  approved: { label: "معتمدة", variant: "default", border: "border-t-4 border-emerald-500" },
  rejected: { label: "مرفوضة", variant: "destructive", border: "border-t-4 border-red-500" },
};

const serviceTypeLabels: Record<string, string> = {
  fixed_price: "سعر ثابت",
  hourly: "بالساعة",
};

interface MyServiceCardProps {
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    service_type: string;
    approval: string;
    categories?: { name: string } | null;
    regions?: { name: string } | null;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MyServiceCard({ service, onEdit, onDelete }: MyServiceCardProps) {
  const status = approvalLabels[service.approval] ?? approvalLabels.pending;

  return (
    <Card className={`card-hover ${status.border} overflow-hidden`}>
      {(service as any).image_url && (
        <div className="w-full h-32 overflow-hidden">
          <img src={(service as any).image_url} alt={service.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">{service.title}</CardTitle>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className="text-xs text-muted-foreground">{serviceTypeLabels[service.service_type]}</span>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="hover:bg-primary/10" onClick={() => onEdit(service.id)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="hover:bg-destructive/10" onClick={() => onDelete(service.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{service.description}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-md text-xs">{service.price} ر.س</span>
          <div className="flex gap-2 text-xs text-muted-foreground">
            {service.categories?.name && <Badge variant="outline" className="text-xs font-normal">{service.categories.name}</Badge>}
            {service.regions?.name && <Badge variant="outline" className="text-xs font-normal">{service.regions.name}</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
