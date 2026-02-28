import { useContractVersions } from "@/hooks/useContractVersions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { History, FileText, Check, DollarSign, Clock, AlertTriangle } from "lucide-react";

interface TimelineEvent {
  type: "version" | "signed" | "escrow" | "dispute" | "timelog";
  date: string;
  title: string;
  detail?: string;
  icon: typeof History;
  color: string;
}

interface ContractTimelineProps {
  contract: any;
  escrow?: any;
  timeLogs?: any[];
  disputes?: any[];
}

export function ContractTimeline({ contract, escrow, timeLogs, disputes }: ContractTimelineProps) {
  const { data: versions, isLoading } = useContractVersions(contract?.id);

  if (isLoading) return <Skeleton className="h-32" />;

  const events: TimelineEvent[] = [];

  // Contract creation
  events.push({
    type: "version",
    date: contract.created_at,
    title: "إنشاء العقد",
    icon: FileText,
    color: "text-primary",
  });

  // Versions
  versions?.forEach((v: any) => {
    events.push({
      type: "version",
      date: v.created_at,
      title: `تعديل العقد - الإصدار ${v.version_number}`,
      detail: v.change_note || undefined,
      icon: History,
      color: "text-blue-500",
    });
  });

  // Signatures
  if (contract.association_signed_at) {
    events.push({
      type: "signed",
      date: contract.association_signed_at,
      title: "توقيع الجمعية",
      icon: Check,
      color: "text-green-600",
    });
  }
  if (contract.provider_signed_at) {
    events.push({
      type: "signed",
      date: contract.provider_signed_at,
      title: "توقيع مقدم الخدمة",
      icon: Check,
      color: "text-green-600",
    });
  }

  // Escrow
  if (escrow) {
    events.push({
      type: "escrow",
      date: escrow.created_at,
      title: `ضمان مالي: ${escrow.amount} ر.س`,
      detail: escrow.status === "held" ? "محتجز" : escrow.status === "released" ? "تم التحرير" : escrow.status === "refunded" ? "مسترد" : escrow.status,
      icon: DollarSign,
      color: "text-amber-500",
    });
  }

  // Time logs summary
  if (timeLogs && timeLogs.length > 0) {
    const totalHours = timeLogs.reduce((sum: number, l: any) => sum + Number(l.hours || 0), 0);
    const approved = timeLogs.filter((l: any) => l.approval === "approved").length;
    events.push({
      type: "timelog",
      date: timeLogs[0].created_at,
      title: `${timeLogs.length} سجل ساعات (${totalHours.toFixed(1)} ساعة)`,
      detail: `${approved} معتمد`,
      icon: Clock,
      color: "text-indigo-500",
    });
  }

  // Disputes
  disputes?.forEach((d: any) => {
    events.push({
      type: "dispute",
      date: d.created_at,
      title: "شكوى: " + (d.description?.slice(0, 50) || ""),
      detail: d.status,
      icon: AlertTriangle,
      color: "text-destructive",
    });
  });

  // Sort by date desc
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!events.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          سجل العمليات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4 pe-6 before:absolute before:[inset-inline-end:0.5rem] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {events.map((event, i) => {
            const Icon = event.icon;
            return (
              <div key={i} className="relative flex items-start gap-3">
                <div className={`absolute [inset-inline-end:-1.15rem] mt-1 rounded-full bg-background p-0.5 border`}>
                  <Icon className={`h-3.5 w-3.5 ${event.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{event.title}</p>
                  {event.detail && <p className="text-xs text-muted-foreground">{event.detail}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(event.date).toLocaleDateString("ar-SA")} - {new Date(event.date).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
