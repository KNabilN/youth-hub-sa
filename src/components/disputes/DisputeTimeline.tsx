import { useDisputeStatusLog } from "@/hooks/useDisputeStatusLog";
import { disputeStatusLabels, disputeTimelineColors } from "@/lib/dispute-statuses";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Clock, ArrowRight } from "lucide-react";

export function DisputeTimeline({ disputeId }: { disputeId: string }) {
  const { data: logs, isLoading } = useDisputeStatusLog(disputeId);

  if (isLoading || !logs?.length) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        سجل تغيير الحالة
      </h4>
      <div className="relative pe-4 border-e-2 border-border space-y-3">
        {logs.map((log: any) => (
          <div key={log.id} className="relative">
            <div className={`absolute [inset-inline-end:-13px] top-1.5 h-2.5 w-2.5 rounded-full ${disputeTimelineColors[log.new_status] || "bg-muted-foreground"}`} />
            <div className="pe-4">
              <div className="flex items-center gap-1.5 text-xs">
                {log.old_status && (
                  <>
                    <span className="text-muted-foreground">{disputeStatusLabels[log.old_status] || log.old_status}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </>
                )}
                <span className="font-medium">{disputeStatusLabels[log.new_status] || log.new_status}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {log.profiles?.full_name || "النظام"} · {format(new Date(log.created_at), "yyyy/MM/dd HH:mm", { locale: ar })}
              </p>
              {log.note && <p className="text-xs mt-0.5">{log.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
