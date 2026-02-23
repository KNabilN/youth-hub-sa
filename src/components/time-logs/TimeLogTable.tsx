import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

interface TimeLog {
  id: string;
  hours: number;
  log_date: string;
  description: string;
  approval: string;
  projects: { title: string } | null;
  profiles: { full_name: string } | null;
}

const approvalMap: Record<string, { label: string; className: string }> = {
  pending: { label: "قيد المراجعة", className: "bg-warning/15 text-warning border-warning/30" },
  approved: { label: "معتمد", className: "bg-success/15 text-success border-success/30" },
  rejected: { label: "مرفوض", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

interface Props {
  logs: TimeLog[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isLoading?: boolean;
}

export function TimeLogTable({ logs, onApprove, onReject, isLoading }: Props) {
  if (!logs.length) return <p className="text-sm text-muted-foreground text-center py-8">لا توجد سجلات ساعات</p>;

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>مقدم الخدمة</TableHead>
            <TableHead>المشروع</TableHead>
            <TableHead>التاريخ</TableHead>
            <TableHead>الساعات</TableHead>
            <TableHead>الوصف</TableHead>
            <TableHead>الحالة</TableHead>
            {(onApprove || onReject) && <TableHead>إجراءات</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map(log => {
            const status = approvalMap[log.approval] ?? approvalMap.pending;
            return (
              <TableRow key={log.id}>
                <TableCell className="font-medium">{log.profiles?.full_name || "-"}</TableCell>
                <TableCell>{log.projects?.title || "-"}</TableCell>
                <TableCell>{new Date(log.log_date).toLocaleDateString("ar-SA")}</TableCell>
                <TableCell>{log.hours}</TableCell>
                <TableCell className="max-w-[200px] truncate">{log.description}</TableCell>
                <TableCell><Badge variant="outline" className={status.className}>{status.label}</Badge></TableCell>
                {(onApprove || onReject) && (
                  <TableCell>
                    {log.approval === "pending" && (
                      <div className="flex gap-1">
                        {onApprove && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onApprove(log.id)} disabled={isLoading}>
                          <Check className="h-3.5 w-3.5 text-success" />
                        </Button>}
                        {onReject && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onReject(log.id)} disabled={isLoading}>
                          <X className="h-3.5 w-3.5 text-destructive" />
                        </Button>}
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
