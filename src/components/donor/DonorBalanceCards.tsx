import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Lock, CheckCircle, Pause, Clock } from "lucide-react";

interface DonorBalanceCardsProps {
  available: number;
  reserved: number;
  consumed: number;
  suspended: number;
  expired: number;
  isLoading?: boolean;
}

export function DonorBalanceCards({ available, reserved, consumed, suspended, expired, isLoading }: DonorBalanceCardsProps) {
  const items = [
    { label: "متاح", value: available, icon: Wallet, color: "text-primary", bg: "bg-primary/10" },
    { label: "محجوز", value: reserved, icon: Lock, color: "text-warning", bg: "bg-warning/10" },
    { label: "مستهلك", value: consumed, icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
    { label: "معلق", value: suspended, icon: Pause, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "منتهي", value: expired, icon: Clock, color: "text-muted-foreground", bg: "bg-muted/50" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map(item => (
        <Card key={item.label}>
          <CardContent className="p-4 text-center space-y-1">
            <div className={`mx-auto w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <p className="text-lg font-bold">{isLoading ? "..." : item.value.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
