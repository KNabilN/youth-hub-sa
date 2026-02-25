import { useEntityAuditLog } from "@/hooks/useEntityAuditLog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

const actionLabels: Record<string, string> = {
  INSERT: "إنشاء",
  UPDATE: "تعديل",
  DELETE: "حذف",
  suspend: "تعليق",
  unsuspend: "إلغاء تعليق",
  approve: "موافقة",
  reject: "رفض",
  reactivate: "إعادة تفعيل",
};

const actionColors: Record<string, string> = {
  INSERT: "bg-emerald-500/10 text-emerald-600",
  UPDATE: "bg-primary/10 text-primary",
  DELETE: "bg-destructive/10 text-destructive",
  suspend: "bg-orange-500/10 text-orange-600",
  unsuspend: "bg-emerald-500/10 text-emerald-600",
  approve: "bg-emerald-500/10 text-emerald-600",
  reject: "bg-destructive/10 text-destructive",
  reactivate: "bg-emerald-500/10 text-emerald-600",
};

function ChangeSummary({ oldValues, newValues }: { oldValues: any; newValues: any }) {
  if (!oldValues && !newValues) return null;

  const skipKeys = ["id", "created_at", "updated_at"];
  const changes: { key: string; from: string; to: string }[] = [];

  if (oldValues && newValues) {
    for (const key of Object.keys(newValues)) {
      if (skipKeys.includes(key)) continue;
      const oldVal = oldValues[key];
      const newVal = newValues[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({
          key,
          from: oldVal != null ? String(oldVal) : "—",
          to: newVal != null ? String(newVal) : "—",
        });
      }
    }
  }

  if (changes.length === 0) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {changes.slice(0, 5).map((c) => (
        <p key={c.key} className="text-[11px] text-muted-foreground">
          <span className="font-medium">{c.key}</span>: {c.from.slice(0, 40)} → {c.to.slice(0, 40)}
        </p>
      ))}
      {changes.length > 5 && (
        <p className="text-[11px] text-muted-foreground">+{changes.length - 5} تغييرات أخرى</p>
      )}
    </div>
  );
}

interface EntityActivityLogProps {
  tableName: string;
  recordId: string | null;
  maxHeight?: string;
}

export function EntityActivityLog({ tableName, recordId, maxHeight = "400px" }: EntityActivityLogProps) {
  const { data, isLoading } = useEntityAuditLog(tableName, recordId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!data?.length) {
    return <p className="text-center text-muted-foreground py-8">لا يوجد سجل نشاط</p>;
  }

  return (
    <ScrollArea style={{ maxHeight }}>
      <div className="space-y-2">
        {data.map((entry: any) => (
          <div key={entry.id} className="border rounded-lg p-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge className={actionColors[entry.action] || "bg-muted text-muted-foreground"}>
                  {actionLabels[entry.action] || entry.action}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {(entry as any).profiles?.full_name || "النظام"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {format(new Date(entry.created_at), "yyyy/MM/dd HH:mm", { locale: ar })}
              </span>
            </div>
            <ChangeSummary oldValues={entry.old_values} newValues={entry.new_values} />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
