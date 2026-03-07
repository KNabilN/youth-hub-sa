import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TimeLog {
  id: string;
  hours: number;
  log_date: string;
  description: string;
  approval: string;
  start_time?: string | null;
  end_time?: string | null;
  rejection_reason?: string | null;
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
  onReject?: (id: string, reason: string) => void;
  isLoading?: boolean;
}

export function TimeLogTable({ logs, onApprove, onReject, isLoading }: Props) {
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  if (!logs.length) return <p className="text-sm text-muted-foreground text-center py-8">لا توجد سجلات ساعات</p>;

  const handleRejectConfirm = () => {
    if (rejectId && onReject) {
      onReject(rejectId, reason);
      setRejectId(null);
      setReason("");
    }
  };

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>مقدم الخدمة</TableHead>
              <TableHead>الطلب</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>الوقت</TableHead>
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
                  <TableCell className="font-medium">{(log.profiles as any)?.organization_name || log.profiles?.full_name || "-"}</TableCell>
                  <TableCell>{log.projects?.title || "-"}</TableCell>
                  <TableCell>{new Date(log.log_date).toLocaleDateString("ar-SA")}</TableCell>
                  <TableCell className="text-xs">
                    {log.start_time && log.end_time
                      ? `${log.start_time.slice(0, 5)} – ${log.end_time.slice(0, 5)}`
                      : "-"}
                  </TableCell>
                  <TableCell>{log.hours}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="truncate">{log.description}</p>
                    {log.approval === "rejected" && log.rejection_reason && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-xs text-destructive mt-0.5 flex items-center gap-1 cursor-help">
                              <AlertCircle className="h-3 w-3" /> {log.rejection_reason}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent><p>{log.rejection_reason}</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                  <TableCell><Badge variant="outline" className={status.className}>{status.label}</Badge></TableCell>
                  {(onApprove || onReject) && (
                    <TableCell>
                      {log.approval === "pending" && (
                        <div className="flex gap-1">
                          {onApprove && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onApprove(log.id)} disabled={isLoading}>
                            <Check className="h-3.5 w-3.5 text-success" />
                          </Button>}
                          {onReject && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setRejectId(log.id)} disabled={isLoading}>
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

      <Dialog open={!!rejectId} onOpenChange={(o) => { if (!o) { setRejectId(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>سبب الرفض</DialogTitle></DialogHeader>
          <Textarea placeholder="أدخل سبب رفض سجل الساعات..." value={reason} onChange={e => setReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectId(null); setReason(""); }}>إلغاء</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={!reason.trim()}>تأكيد الرفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
