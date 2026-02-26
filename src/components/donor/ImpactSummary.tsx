import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, HandCoins, FolderKanban } from "lucide-react";

interface ImpactSummaryProps {
  totalDonations: number;
  projectsFunded: number;
  associationsSupported: number;
  isLoading?: boolean;
}

export function ImpactSummary({ totalDonations, projectsFunded, associationsSupported, isLoading }: ImpactSummaryProps) {
  const items = [
    { title: "إجمالي المنح", value: `${totalDonations.toLocaleString()} ر.س`, icon: HandCoins, color: "text-primary" },
    { title: "الطلبات الممولة", value: projectsFunded, icon: FolderKanban, color: "text-info" },
    { title: "الجمعيات المدعومة", value: associationsSupported, icon: Users, color: "text-success" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
